import { buildRoutesMap, route, navigate, pathToAction } from '../core';

const routesMap = buildRoutesMap(
	route('PROJECT', '/portal/projects/:projectName'),
	route('PROJECTS', '/portal/projects'),
	route('DOWNLOAD', '/portal/download'),
	route('MODEL', '/portal/model/:tags*')
);

describe('pathToAction', () => {
	test('defined route, no params', () => {
		expect(
			pathToAction(routesMap, {
				pathname: '/portal/projects',
			})
		).toEqual(navigate('PROJECTS'));
	});

	test('defined route, with params', () => {
		expect(
			pathToAction(routesMap, {
				pathname: '/portal/projects/Project123',
			})
		).toEqual(navigate('PROJECT', { projectName: 'Project123' }));
	});

	test('defined route, with zero or more params', () => {
		expect(
			pathToAction(routesMap, {
				pathname: '/portal/model',
			})
		).toEqual(navigate('MODEL', {}));

		expect(
			pathToAction(routesMap, {
				pathname: '/portal/model/tag1/tag2/tag3',
			})
		).toEqual(navigate('MODEL', { tags: ['tag1', 'tag2', 'tag3'] }));
	});

	test('defined route, with params, with search', () => {
		expect(
			pathToAction(routesMap, {
				pathname: '/portal/projects/Project123',
				search: '?returnTo=home',
			})
		).toEqual(
			navigate('PROJECT', { projectName: 'Project123' }, { query: { returnTo: 'home' } })
		);
	});

	test('defined route, with params, without search', () => {
		expect(
			pathToAction(routesMap, {
				pathname: '/portal/projects/Project123',
				search: '',
			})
		).toEqual(navigate('PROJECT', { projectName: 'Project123' }));
	});

	test('undefined route', () => {
		expect(
			pathToAction(routesMap, {
				pathname: '/portal/undefined',
			})
		).toEqual(navigate('NOT_FOUND'));
	});

	test('NULL path', () => {
		expect(pathToAction(routesMap, null)).toBe(null);
	});
});
