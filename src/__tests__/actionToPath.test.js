import { actionToPath, buildRoutesMap, route, navigate } from '../index';

const routesMap = buildRoutesMap(
	route('JOB', '/portal/projects/:projectName/:jobId'),
	route('PROJECT', '/portal/projects/:projectName'),
	route('PROJECTS', '/portal/projects'),
	route('DOWNLOAD', '/portal/download')
);

describe('actionToPath', () => {
	test('defined route, no params', () => {
		expect(actionToPath(routesMap, navigate('PROJECTS'))).toBe('/portal/projects');
	});

	test('defined route, with params', () => {
		expect(actionToPath(routesMap, navigate('PROJECT', { projectName: 'Project 123' }))).toBe(
			'/portal/projects/Project%20123'
		);
	});

	test('defined route, with missing params', () => {
		expect(() => {
			actionToPath(routesMap, navigate('JOB', { projectName: 'Project 123' }));
		}).toThrow();
	});

	test('undefined route', () => {
		expect(actionToPath(routesMap, navigate('UNDEFINED'))).toBe(null);
	});

	test('NULL action', () => {
		expect(actionToPath(routesMap, null)).toBe(null);
	});
});
