import { buildRoutesMap, route, navigate, pathToAction } from '../index';

const routesMap = buildRoutesMap(
	route('PROJECT', '/portal/projects/:projectName'),
	route('PROJECTS', '/portal/projects'),
	route('DOWNLOAD', '/portal/download'),
	route('MODEL', '/portal/model/:tags*')
);

describe('pathToAction', () => {
	test('defined route, no params', () => {
		expect(pathToAction(routesMap, '/portal/projects')).toEqual(navigate('PROJECTS'));
	});

	test('defined route, with params', () => {
		expect(pathToAction(routesMap, '/portal/projects/Project123')).toEqual(
			navigate('PROJECT', { projectName: 'Project123' })
		);
	});

	test('defined route, with zero or more params', () => {
		expect(pathToAction(routesMap, '/portal/model')).toEqual(navigate('MODEL', {}));

		expect(pathToAction(routesMap, '/portal/model/tag1/tag2/tag3')).toEqual(
			navigate('MODEL', { tags: ['tag1', 'tag2', 'tag3'] })
		);
	});

	test('defined route, with params, with search', () => {
		expect(pathToAction(routesMap, '/portal/projects/Project123', '?returnTo=home')).toEqual(
			navigate('PROJECT', { projectName: 'Project123' }, { query: { returnTo: 'home' } })
		);
	});

	test('defined route, with params, without search', () => {
		expect(pathToAction(routesMap, '/portal/projects/Project123', '')).toEqual(
			navigate('PROJECT', { projectName: 'Project123' })
		);
	});

	test('defined route, with params, with state', () => {
		expect(
			pathToAction(routesMap, '/portal/projects/Project123', '?returnTo=home', {
				custom: 123,
			})
		).toEqual(
			navigate(
				'PROJECT',
				{ projectName: 'Project123', custom: 123 },
				{ query: { returnTo: 'home' } }
			)
		);
	});

	test('undefined route', () => {
		expect(pathToAction(routesMap, '/portal/undefined')).toEqual(navigate('NOT_FOUND'));
	});

	test('NULL path', () => {
		expect(pathToAction(routesMap, null)).toBe(null);
	});
});
