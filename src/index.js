import { eventChannel, buffers } from 'redux-saga';
import { take, put, call, takeLatest, fork } from 'redux-saga/effects';
import pathToRegexp from 'path-to-regexp';
import queryString from 'query-string';

export const NAVIGATE = 'router/NAVIGATE';

export function navigate(id, params = {}, opts = {}) {
	return { type: NAVIGATE, id, params, ...opts };
}

export function route(id, path, saga) {
	return { id, path, saga };
}

export function buildRoutesMap(...routes) {
	return new Map(
		routes.map(({ id, path, saga }) => {
			const keys = [];
			const re = pathToRegexp(path, keys);
			const toPath = pathToRegexp.compile(path);
			return [id, { id, path, saga, re, keys, toPath }];
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

export function actionToPath(routesMap, action) {
	const route = routesMap.get(action && action.id) || null;
	const path = route && route.toPath(action.params);
	return path && ((action.query && `${path}?${queryString.stringify(action.query)}`) || path);
}

export function pathToAction(routesMap, path, search, state = {}) {
	if (!path || typeof path !== 'string') {
		return null;
	}

	const query = search && queryString.parse(search);

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

		return navigate(id, { ...params, ...state }, { query });
	}

	return navigate('NOT_FOUND');
}

export function createHistoryChannel(history) {
	return eventChannel(emitter => {
		emitter({ location: history.location });

		const ignore = history.listen((location, action) => {
			emitter({ location, action });
		});

		return () => {
			ignore();
		};
	}, buffers.fixed());
}

export function* onNavigate(routesMap, { id, params, query }) {
	const r = routesMap.get(id);
	if (r && r.saga) {
		yield fork(r.saga, params, query);
	}
}

export function* routeSaga(routesMap) {
	yield takeLatest(NAVIGATE, onNavigate, routesMap);
}

export function* historyToStore(routesMap, historyChannel) {
	while (true) {
		const { location, action } = yield take(historyChannel);
		if (!action || action === 'POP') {
			const navigateAction = pathToAction(
				routesMap,
				location.pathname,
				location.search,
				location.state
			);
			yield put(navigateAction);
		}
	}
}

export function* storeToHistory(routesMap, history) {
	while (true) {
		const navigateAction = yield take(NAVIGATE);
		const navigatePath = actionToPath(routesMap, navigateAction);
		const currentAction = pathToAction(
			routesMap,
			history.location.pathname,
			history.location.search
		);
		const currentPath = actionToPath(routesMap, currentAction); // normalized
		if (navigatePath && navigatePath !== currentPath) {
			history[navigateAction.replace ? 'replace' : 'push'](navigatePath, {
				...navigateAction.params,
			});
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
