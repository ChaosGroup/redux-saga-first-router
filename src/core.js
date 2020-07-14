import { compile as p2rCompile, match as p2rMatch } from 'path-to-regexp';

export const NAVIGATE = 'router/NAVIGATE';

export function navigate(id, params = {}, opts = {}) {
	return { type: NAVIGATE, id, params, ...opts };
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

	const path = route.toPath(action.params) || '/';

	const query = new URLSearchParams(action.query ?? {});
	query.sort();

	return `${path}${Array.from(query.keys()).length ? `?${query.toString()}` : ''}`;
}

export const NOT_FOUND = 'NOT_FOUND';

export function pathToAction(routesMap, path, search, state) {
	if (typeof path !== 'string') {
		return null;
	}

	for (const [id, route] of routesMap.entries()) {
		const match = route.match(path);
		if (match) {
			const query = new URLSearchParams(search ?? '');
			query.sort();

			return navigate(
				id,
				{ ...match.params, ...(state ?? {}) },
				{ ...(Array.from(query.keys()).length ? { query: Object.fromEntries(query) } : {}) }
			);
		}
	}

	return navigate(NOT_FOUND);
}
