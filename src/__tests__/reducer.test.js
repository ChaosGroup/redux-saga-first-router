import { reducer, navigate } from '../index';

describe('reducer', () => {
	test('should return the initial state', () => {
		expect(reducer(undefined, {})).toEqual({
			id: null,
			params: null,
			query: null,
			prev: null,
		});
	});

	test('should handle NAVIGATE', () => {
		const state = {
			id: null,
			params: null,
			query: null,
			prev: null,
		};
		const action = navigate(
			'PROJECT',
			{ projectName: 'Project 123' },
			{ query: { returnTo: 'home' } }
		);

		expect(reducer(state, action)).toEqual({
			id: 'PROJECT',
			params: { projectName: 'Project 123' },
			query: { returnTo: 'home' },
			prev: null,
		});
	});

	test('should handle NAVIGATE and store previous route', () => {
		const state = {
			id: 'PROJECTS',
			params: {},
			query: null,
			prev: null,
		};
		const action = navigate(
			'PROJECT',
			{ projectName: 'Project 123' },
			{ query: { returnTo: 'home' } }
		);

		expect(reducer(state, action)).toEqual({
			id: 'PROJECT',
			params: { projectName: 'Project 123' },
			query: { returnTo: 'home' },
			prev: {
				id: 'PROJECTS',
				params: {},
				query: null,
				prev: null,
			},
		});
	});

	test('should ignore UNKNOWN actions', () => {
		const state = {
			id: 'PROJECTS',
			params: {},
			query: null,
			prev: null,
		};

		expect(reducer(state, { type: 'UNKNOWN' })).toBe(state);
	});
});
