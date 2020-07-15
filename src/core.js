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

function stringifyQuery(query) {
	if (!query) {
		return '';
	}

	const _query = new URLSearchParams();
	for (const key in query) {
		const val = query[key];
		if (Array.isArray(val)) {
			for (const _val of val) {
				_query.append(key, _val);
			}
		} else {
			_query.append(key, val);
		}
	}
	_query.sort();
	return `?${_query.toString()}`;
}

export function actionToPath(routesMap, action) {
	const route = routesMap.get(action && action.id);
	if (!route) {
		return null;
	}

	return {
		pathname: route.toPath(action.params) || '/',
		search: stringifyQuery(action.query),
	};
}

export const NOT_FOUND = 'NOT_FOUND';

function parseSearch(search) {
	let query = null;
	const _query = new URLSearchParams(search ?? '');
	_query.sort();
	for (const key of _query.keys()) {
		if (!query) {
			query = {};
		}
		const val = _query.getAll(key);
		query[key] = val.length > 1 ? val : val[0];
	}
	return query;
}

export function pathToAction(routesMap, location) {
	const { pathname, search } = location ?? {};

	if (typeof pathname !== 'string') {
		return null;
	}

	for (const [id, route] of routesMap) {
		const match = route.match(pathname);
		if (match) {
			return navigate(id, { ...match.params }, { query: parseSearch(search) });
		}
	}

	return navigate(NOT_FOUND);
}