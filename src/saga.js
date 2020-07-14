import { eventChannel, buffers } from 'redux-saga';
import { take, put, call, fork, cancel } from 'redux-saga/effects';
import { Action } from 'history';

import { NAVIGATE, actionToPath, pathToAction } from './core';
import equal from './equal';

function copyAction({ id, params, query = null } = {}) {
	return { id, params, query };
}

export function createHistoryChannel(history) {
	return eventChannel(emitter => {
		emitter({ location: history.location });

		const stop = history.listen(({ location, action }) => {
			emitter({ location, action });
		});

		return () => {
			stop();
		};
	}, buffers.expanding());
}

export const HISTORY_STAMP = Symbol('HISTORY_STAMP');

export function* routeSaga(routesMap) {
	let currentAction;
	let currentNavigateTask;
	let currentQueryTask;

	function* cancelCurrentNavigateTask() {
		if (currentNavigateTask) {
			const _t = currentNavigateTask;
			currentNavigateTask = null;
			yield cancel(_t);
		}
	}
	function* forkNavigateTask(route, params, query) {
		if (route && route.navigateSaga) {
			currentNavigateTask = yield fork(route.navigateSaga, params, query);
		}
	}
	function* cancelCurrentQueryTask() {
		if (currentQueryTask) {
			const _t = currentQueryTask;
			currentQueryTask = null;
			yield cancel(_t);
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

		const newAction = copyAction(navigateAction);

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
		if (!action || action === Action.Pop) {
			console.log('opa', location);
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
		const newAction = copyAction(navigateAction);
		if (!currentAction || !equal(currentAction, newAction)) {
			currentAction = newAction;
			if (!navigateAction[HISTORY_STAMP]) {
				const navigatePath = actionToPath(routesMap, navigateAction);
				if (navigatePath !== null) {
					const hargs = [navigatePath, { ...navigateAction.params }];
					if (navigateAction.replace) {
						history.replace(...hargs);
					} else {
						history.push(...hargs);
					}
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
