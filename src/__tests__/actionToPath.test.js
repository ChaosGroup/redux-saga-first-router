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
			hash: '',
		});
	});

	test('defined route, with params', () => {
		expect(
			actionToPath(routesMap, navigate('PROJECT', { projectName: 'Project 123' }))
		).toEqual({
			pathname: '/portal/projects/Project%20123',
			search: '',
			hash: '',
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
				navigate('PROJECT', { projectName: 'Project 123' },
					{ query: { returnTo: 'home', missing: undefined, unspecified: null } })
			)
		).toEqual({
			pathname: '/portal/projects/Project%20123',
			search: '?returnTo=home',
			hash: '',
		});
	});

	test('defined route, with params and query and hash', () => {
		expect(
			actionToPath(
				routesMap,
				navigate(
					'PROJECT',
					{ projectName: 'Project 123' },
					{ query: { returnTo: 'home' }, hash: 'hello' }
				)
			)
		).toEqual({
			pathname: '/portal/projects/Project%20123',
			search: '?returnTo=home',
			hash: '#hello',
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
			hash: '',
		});
	});

	test('undefined route', () => {
		expect(actionToPath(routesMap, navigate('UNDEFINED'))).toBe(null);
	});

	test('NULL action', () => {
		expect(actionToPath(routesMap, null)).toBe(null);
	});
});
