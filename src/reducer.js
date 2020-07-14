import { NAVIGATE } from './core';

const INITIAL_STATE = {
	id: null,
	params: null,
	query: null,
	prev: null,
};

export function reducer(state = INITIAL_STATE, action) {
	return action.type === NAVIGATE
		? {
				id: action.id,
				params: action.params,
				query: action.query,
				prev: state.id ? { ...state, prev: null } : null,
		  }
		: state;
}
