import { actionToPath, buildRoutesMap, route, navigate } from '../core';

const routesMap = buildRoutesMap(
	route('JOB', '/portal/projects/:projectName/:jobId'),
	route('PROJECT', '/portal/projects/:projectName'),
	route('PROJECTS', '/portal/projects'),
	route('DOWNLOAD', '/portal/download')
);

describe('actionToPath', () => {
	test('defined route, no params', () => {
		expect(actionToPath(routesMap, navigate('PROJECTS'))).toEqual({
			pathname: '/portal/projects',
			search: '',
		});
	});

	test('defined route, with params', () => {
		expect(
			actionToPath(routesMap, navigate('PROJECT', { projectName: 'Project 123' }))
		).toEqual({
			pathname: '/portal/projects/Project%20123',
			search: '',
		});
	});

	test('defined route, with missing params', () => {
		expect(() => {
			actionToPath(routesMap, navigate('JOB', { projectName: 'Project 123' }));
		}).toThrow();
	});

	test('defined route, with params and query', () => {
		expect(
			actionToPath(
				routesMap,
				navigate('PROJECT', { projectName: 'Project 123' }, { query: { returnTo: 'home' } })
			)
		).toEqual({
			pathname: '/portal/projects/Project%20123',
			search: '?returnTo=home',
		});
	});

	test('defined route, with params and query and repeating keys', () => {
		expect(
			actionToPath(
				routesMap,
				navigate(
					'PROJECT',
					{ projectName: 'Project 123' },
					{ query: { returnTo: 'home', key1: ['1', '3'], key2: '2' } }
				)
			)
		).toEqual({
			pathname: '/portal/projects/Project%20123',
			search: '?key1=1&key1=3&key2=2&returnTo=home',
		});
	});

	test('undefined route', () => {
		expect(actionToPath(routesMap, navigate('UNDEFINED'))).toBe(null);
	});

	test('NULL action', () => {
		expect(actionToPath(routesMap, null)).toBe(null);
	});
});
