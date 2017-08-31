import { buildRoutesMap, route } from '../index';

describe('buildRoutesMap', () => {
	const routes = [
		route('JOB', '/portal/projects/:projectName/:jobId'),
		route('PROJECT', '/portal/projects/:projectName'),
		route('PROJECTS', '/portal/projects', function*() {}),
		route('DOWNLOAD', '/portal/download'),
	];

	test('should build routes Map and preserve order', () => {
		const routesMap = buildRoutesMap(...routes);
		expect(routesMap).toBeInstanceOf(Map);

		const projectRoute = routesMap.get('PROJECT');
		expect(projectRoute).toBeDefined();
		expect(projectRoute).toHaveProperty('id', 'PROJECT');
		expect(projectRoute).toHaveProperty('path', '/portal/projects/:projectName');
		expect(projectRoute).toHaveProperty('re');
		expect(projectRoute.re).toBeInstanceOf(RegExp);
		expect(projectRoute).toHaveProperty('keys');
		expect(projectRoute.keys).toBeInstanceOf(Array);
		expect(projectRoute).toHaveProperty('toPath');
		expect(projectRoute.toPath).toBeInstanceOf(Function);
		expect(projectRoute).toHaveProperty('saga');
		expect(projectRoute.saga).toBeUndefined();

		const projectsRoute = routesMap.get('PROJECTS');
		expect(projectsRoute).toBeDefined();
		expect(projectsRoute).toHaveProperty('saga');
		expect(projectsRoute.saga).toBeInstanceOf(Function);

		const keys = Array.from(routesMap.keys());
		expect(keys).toEqual(['JOB', 'PROJECT', 'PROJECTS', 'DOWNLOAD']);
	});
});
