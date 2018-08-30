import { take, put } from 'redux-saga/effects';
import createHistory from 'history/createMemoryHistory';

import {
	navigate,
	NAVIGATE,
	buildRoutesMap,
	route,
	createHistoryChannel,
	historyToStore,
	storeToHistory,
} from '../index';

const jobNavigate = function*() {};
const projectNavigate = function*() {};

const routesMap = buildRoutesMap(
	route('JOB', '/portal/projects/:projectName/:jobId', jobNavigate),
	route('PROJECT', '/portal/projects/:projectName', projectNavigate),
	route('PROJECTS', '/portal/projects'),
	route('DOWNLOAD', '/portal/download')
);

describe('routeSaga', () => {
	//TODO: !!
});

describe('historyToStore', () => {
	test('should dispatch navigate when POP location received', () => {
		const history = createHistory();
		const historyChannel = createHistoryChannel(history);

		const gen = historyToStore(routesMap, historyChannel);

		// wait for historyChannel
		expect(gen.next().value).toEqual(take(historyChannel));

		// when POP location received dispatch navigate
		expect(
			gen.next({
				location: { pathname: '/portal/projects/Project%20123', search: '?returnTo=home' },
				action: 'POP',
			}).value
		).toEqual(
			put(
				navigate('PROJECT', { projectName: 'Project 123' }, { query: { returnTo: 'home' } })
			)
		);

		// wait for more
		expect(gen.next().value).toEqual(take(historyChannel));
	});

	test('should ignore when PUSH/REPLACE location received', () => {
		const history = createHistory();
		const historyChannel = createHistoryChannel(history);

		const gen = historyToStore(routesMap, historyChannel);

		// wait for historyChannel
		expect(gen.next().value).toEqual(take(historyChannel));

		// when not-POP location received wait for more
		expect(
			gen.next({
				location: { pathname: '/portal/projects/Project%20123', search: '?returnTo=home' },
				action: 'PUSH',
			}).value
		).toEqual(take(historyChannel));
	});
});

describe('storeToHistory', () => {
	test('should update history when NAVIGATE received', () => {
		const history = createHistory();

		const gen = storeToHistory(routesMap, history);

		// wait for navigate action
		expect(gen.next().value).toEqual(take(NAVIGATE));

		// when received, update history and wait for more
		expect(
			gen.next(
				navigate('PROJECT', { projectName: 'Project 123' }, { query: { returnTo: 'home' } })
			).value
		).toEqual(take(NAVIGATE));

		// history updated with PUSH
		expect(history).toMatchObject({
			// ? memory history removes URL encoding
			location: { pathname: '/portal/projects/Project 123', search: '?returnTo=home' },
			action: 'PUSH',
			length: 2,
		});
	});

	test('should update history with REPLACE when specified', () => {
		const history = createHistory();

		const gen = storeToHistory(routesMap, history);

		// wait for navigate action
		expect(gen.next().value).toEqual(take(NAVIGATE));

		// when received, update history and wait for more
		expect(gen.next(navigate('PROJECTS', {}, { replace: true })).value).toEqual(take(NAVIGATE));

		// history updated with REPLACE
		expect(history).toMatchObject({
			location: { pathname: '/portal/projects' },
			action: 'REPLACE',
			length: 1,
		});
	});

	test("shouldn't update history with unknown route", () => {
		const history = createHistory();
		const gen = storeToHistory(routesMap, history);

		// wait for navigate action
		expect(gen.next().value).toEqual(take(NAVIGATE));

		// when received, dont update history and wait for more
		expect(gen.next(navigate('UNKNOWN')).value).toEqual(take(NAVIGATE));

		// history not updated
		expect(history.length).toBe(1);
	});
});
