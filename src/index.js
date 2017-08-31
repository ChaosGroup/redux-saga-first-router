import { eventChannel, buffers } from 'redux-saga';
import { take, put, all, call, takeLatest, fork } from 'redux-saga/effects';
import pathToRegexp from 'path-to-regexp';

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
	path: null,
	params: null,
	prev: null,
};

export function reducer(state = initialState, action) {
	if (action.type === NAVIGATE) {
		return {
			id: action.id,
			params: action.params,
			path: action.path || null,
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
	return route && route.toPath(action.params);
}

export function pathToAction(routesMap, path, state = {}) {
	if (!path || typeof path !== 'string') {
		return null;
	}

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

		return navigate(id, { ...params, ...state });
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

export function* onNavigate(routesMap, { id, params }) {
	const r = routesMap.get(id);
	if (r && r.saga) {
		yield fork(r.saga, params);
	}
}

export function* routeSaga(routesMap) {
	yield takeLatest(NAVIGATE, onNavigate, routesMap);
}

export function* historyToStore(routesMap, historyChannel) {
	while (true) {
		const { location, action } = yield take(historyChannel);
		if (!action || action === 'POP') {
			const navigateAction = pathToAction(routesMap, location.pathname, location.state);
			yield put(navigateAction);
		}
	}
}

export function* storeToHistory(routesMap, history) {
	while (true) {
		const navigateAction = yield take(NAVIGATE);
		const navigatePath = actionToPath(routesMap, navigateAction);
		const currentAction = pathToAction(routesMap, history.location.pathname);
		const currentPath = actionToPath(routesMap, currentAction); // normalized
		if (navigatePath && navigatePath !== currentPath) {
			history[navigateAction.replace ? 'replace' : 'push'](navigatePath, {
				...navigateAction.params,
			});
		}
	}
}

export function* saga(routesMap, history) {
	const historyChannel = yield call(createHistoryChannel, history);

	yield all([
		call(routeSaga, routesMap),
		call(historyToStore, routesMap, historyChannel),
		call(storeToHistory, routesMap, history),
	]);
}
