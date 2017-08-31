import { navigate, NAVIGATE } from '../index';

describe('navigate', () => {
	test('should create NAVIGATE action', () => {
		const action = navigate('PROJECT', { projectName: 'Project 123' }, { replace: true });

		expect(action).toBeDefined();
		expect(action).toHaveProperty('type', NAVIGATE);
		expect(action).toHaveProperty('id', 'PROJECT');
		expect(action).toHaveProperty('params');
		expect(action.params).toEqual({ projectName: 'Project 123' });
		expect(action).toHaveProperty('replace', true);
	});
});
