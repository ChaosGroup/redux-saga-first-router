import { reducer, navigate } from '../index';

describe('reducer', () => {
	test('should return the initial state', () => {
		expect(reducer(undefined, {})).toEqual({
			id: null,
			path: null,
			params: null,
			prev: null,
		});
	});

	test('should handle NAVIGATE', () => {
		const state = {
			id: null,
			path: null,
			params: null,
			prev: null,
		};
		const action = navigate('PROJECT', { projectName: 'Project 123' });

		expect(reducer(state, action)).toEqual({
			id: 'PROJECT',
			path: null,
			params: { projectName: 'Project 123' },
			prev: null,
		});
	});

	test('should handle NAVIGATE and store previous route', () => {
		const state = {
			id: 'PROJECTS',
			path: null,
			params: {},
			prev: null,
		};
		const action = navigate('PROJECT', { projectName: 'Project 123' });

		expect(reducer(state, action)).toEqual({
			id: 'PROJECT',
			path: null,
			params: { projectName: 'Project 123' },
			prev: {
				id: 'PROJECTS',
				path: null,
				params: {},
				prev: null,
			},
		});
	});

	test('should ignore UNKNOWN actions', () => {
		const state = {
			id: 'PROJECTS',
			path: null,
			params: {},
			prev: null,
		};

		expect(reducer(state, { type: 'UNKNOWN' })).toBe(state);
	});
});
