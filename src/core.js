import { compile as p2rCompile, match as p2rMatch } from 'path-to-regexp';

export const NAVIGATE = 'router/NAVIGATE';

export function navigate(id, params = {}, opts = {}) {
	return { type: NAVIGATE, id, params, query: null, ...opts };
}

export function route(id, path, navigateSaga, querySaga) {
	return { id, path, navigateSaga, querySaga };
}

export function buildRoutesMap(...routes) {
	return new Map(
		routes.map(route => [
			route.id,
			{
				...route,
				match: p2rMatch(route.path, { decode: decodeURIComponent }),
				toPath: p2rCompile(route.path, { encode: encodeURIComponent }),
			},
		])
	);
}

export function actionToPath(routesMap, action) {
	const route = routesMap.get(action && action.id);
	if (!route) {
		return null;
	}

	const pathname = route.toPath(action.params) || '/';

	const query = new URLSearchParams(action.query ?? {});
	query.sort();
	const search = Array.from(query.keys()).length ? `?${query.toString()}` : '';

	return { pathname, search };
}

export const NOT_FOUND = 'NOT_FOUND';

export function pathToAction(routesMap, location) {
	const { pathname, search } = location ?? {};

	if (typeof pathname !== 'string') {
		return null;
	}

	for (const [id, route] of routesMap.entries()) {
		const match = route.match(pathname);
		if (match) {
			const query = new URLSearchParams(search ?? '');
			query.sort();

			return navigate(
				id,
				{ ...match.params },
				{ query: Array.from(query.keys()).length ? Object.fromEntries(query) : null }
			);
		}
	}

	return navigate(NOT_FOUND);
}
