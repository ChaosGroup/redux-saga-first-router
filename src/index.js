import { eventChannel, buffers } from 'redux-saga';
import { take, put, call, fork, cancel } from 'redux-saga/effects';
import pathToRegexp from 'path-to-regexp';

export const NAVIGATE = 'router/NAVIGATE';

export function navigate(id, params = {}, opts = {}) {
	return { type: NAVIGATE, id, params, ...opts };
}

export function route(id, path, navigateSaga, querySaga) {
	return { id, path, navigateSaga, querySaga };
}

export function buildRoutesMap(...routes) {
	return new Map(
		routes.map(route => {
			const { id, path } = route;
			const keys = [];
			const re = pathToRegexp(path, keys);
			const toPath = pathToRegexp.compile(path);
			return [id, { ...route, re, keys, toPath }];
		})
	);
}

const initialState = {
	id: null,
	params: null,
	query: null,
	prev: null,
};

export function reducer(state = initialState, action) {
	if (action.type === NAVIGATE) {
		return {
			id: action.id,
			params: action.params,
			query: action.query,
			prev: state.id && {
				...state,
				prev: null,
			},
		};
	}
	return state;
}

// epoberezkin/fast-deep-equal
export function equal(a, b) {
	if (a === b) {
		return true;
	}

	// is NaN
	// eslint-disable-next-line no-self-compare
	if (a !== a && b !== b) {
		return true;
	}

	if (a && b && typeof a === 'object' && typeof b === 'object') {
		const arrA = Array.isArray(a);
		const arrB = Array.isArray(b);

		if (arrA && arrB) {
			if (a.length !== b.length) return false;
			for (let i = a.length; i-- !== 0; ) {
				if (!equal(a[i], b[i])) {
					return false;
				}
			}
			return true;
		}

		if (arrA !== arrB) {
			return false;
		}

		const dateA = a instanceof Date;
		const dateB = b instanceof Date;
		if (dateA !== dateB) {
			return false;
		}
		if (dateA && dateB) {
			return a.getTime() === b.getTime();
		}

		const regexpA = a instanceof RegExp;
		const regexpB = b instanceof RegExp;
		if (regexpA !== regexpB) {
			return false;
		}
		if (regexpA && regexpB) {
			return a.toString() === b.toString();
		}

		const keys = Object.keys(a);
		if (keys.length !== Object.keys(b).length) {
			return false;
		}

		for (let i = keys.length; i-- !== 0; ) {
			if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
				return false;
			}
		}

		for (let i = keys.length; i-- !== 0; ) {
			let key = keys[i];
			if (!equal(a[key], b[key])) {
				return false;
			}
		}

		return true;
	}

	return false;
}

export function queryStringify(query) {
	const encode = input => encodeURIComponent(input);
	query = query || {};
	return Object.keys(query)
		.sort()
		.filter(key => query[key] !== undefined)
		.map(key => {
			const value = query[key];
			return (Array.isArray(value) ? value : [value])
				.filter((value, index, arr) => arr.indexOf(value) === index)
				.map(value => {
					return [key]
						.concat(value !== null ? [value] : [])
						.map(encode)
						.join('=');
				})
				.join('&');
		})
		.join('&');
}

export function queryParse(query) {
	if (typeof query !== 'string' || !query.length) {
		return null;
	}

	const decode = input => decodeURIComponent(input.replace(/\+/g, ' '));
	const parser = /([^=?&]+)=?([^&]*)/g;

	const result = Object.create(null);

	let part;
	while ((part = parser.exec(query))) {
		const all = decode(part[0]);
		const key = decode(part[1]);
		const value = all === key ? null : decode(part[2]);
		result[key] = key in result ? [].concat(result[key], value) : value;
	}

	return result;
}

function actionMask({ id, params, query = null } = {}) {
	return { id, params, query };
}

export function actionToPath(routesMap, action) {
	const route = routesMap.get(action && action.id) || null;
	const path = route && route.toPath(action.params);
	const query = action && action.query && queryStringify(action.query);
	const parts = path && [path].concat(query || []);
	return parts && parts.join('?');
}

export function pathToAction(routesMap, path, search, state = {}) {
	if (typeof path !== 'string') {
		return null;
	}

	const query = queryParse(search);
	const opts = query && { query };

	for (const [id, route] of routesMap.entries()) {
		const captures = path.match(route.re);
		if (!captures) {
			continue;
		}

		const params = captures.slice(1).reduce((params, capture, index) => {
			const key = route.keys[index];
			const value = typeof capture === 'string' ? decodeURIComponent(capture) : capture;

			params[key.name] = value;

			return params;
		}, {});

		return navigate(id, { ...params, ...state }, opts);
	}

	return navigate('NOT_FOUND');
}

export function createHistoryChannel(history) {
	return eventChannel(emitter => {
		emitter({ location: history.location });

		const stop = history.listen((location, action) => {
			emitter({ location, action });
		});

		return () => {
			stop();
		};
	}, buffers.expanding());
}

export const HISTORY_STAMP = Symbol();

export function* routeSaga(routesMap) {
	let currentAction;
	let currentNavigateTask;
	let currentQueryTask;

	function* cancelCurrentNavigateTask() {
		if (currentNavigateTask) {
			yield cancel(currentNavigateTask);
			currentNavigateTask = null;
		}
	}
	function* forkNavigateTask(route, params, query) {
		if (route && route.navigateSaga) {
			currentNavigateTask = yield fork(route.navigateSaga, params, query);
		}
	}
	function* cancelCurrentQueryTask() {
		if (currentQueryTask) {
			yield cancel(currentQueryTask);
			currentQueryTask = null;
		}
	}
	function* forkQueryTask(route, params, query) {
		if (route && route.querySaga) {
			currentQueryTask = yield fork(route.querySaga, params, query);
		}
	}

	while (true) {
		const navigateAction = yield take(NAVIGATE);
		const { id, params, query } = navigateAction;

		const route = routesMap.get(id);
		if (!route) {
			continue;
		}

		const newAction = actionMask(navigateAction);

		const sameRoute =
			!navigateAction.force &&
			!!currentAction &&
			currentAction.id === id &&
			equal(currentAction.params, params);

		const queryChangeOnly = sameRoute && !equal(currentAction.query, query || null);

		currentAction = newAction;

		if (!sameRoute) {
			yield* cancelCurrentQueryTask();
			yield* cancelCurrentNavigateTask();

			yield* forkNavigateTask(route, params, query);
			continue;
		}

		if (queryChangeOnly && navigateAction[HISTORY_STAMP]) {
			yield* cancelCurrentQueryTask();

			yield* forkQueryTask(route, params, query);
			continue;
		}
	}
}

export function* historyToStore(routesMap, historyChannel) {
	while (true) {
		const { location, action } = yield take(historyChannel);
		if (!action || action === 'POP') {
			const { pathname, search, state } = location;
			const navigateAction = pathToAction(routesMap, pathname, search, state);
			if (navigateAction) {
				navigateAction[HISTORY_STAMP] = true;
				yield put(navigateAction);
			}
		}
	}
}

export function* storeToHistory(routesMap, history) {
	let currentAction;

	while (true) {
		const navigateAction = yield take(NAVIGATE);
		const newAction = actionMask(navigateAction);
		if (!currentAction || !equal(currentAction, newAction)) {
			currentAction = newAction;
			if (!navigateAction[HISTORY_STAMP]) {
				const navigatePath = actionToPath(routesMap, navigateAction);
				if (navigatePath) {
					history[navigateAction.replace ? 'replace' : 'push'](navigatePath, {
						...navigateAction.params,
					});
				}
			}
		}
	}
}

export function* saga(routesMap, history) {
	// register NAVIGATE listeners
	yield fork(routeSaga, routesMap);
	yield fork(storeToHistory, routesMap, history);

	// init NAVIGATE emitter
	const historyChannel = yield call(createHistoryChannel, history);
	yield fork(historyToStore, routesMap, historyChannel);
}
