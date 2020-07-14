import React, { PureComponent } from 'react';

function ScreenA() {
	return <p>Hello from A screen</p>;
}

function ScreenB({ timeStamp }) {
	return <p>Hello from B screen, timeStamp: {timeStamp}</p>;
}

function ScreenC({ opt }) {
	return <p>Hello from C screen{opt ? `, opt: ${opt}` : ''}</p>;
}

function ScreenError({ error }) {
	return <p>Error: {error}</p>;
}

const ROUTE_SCREENS = {
	A: ScreenA,
	B: ScreenB,
	C: ScreenC,
};

class Screen extends PureComponent {
	state = { error: null };

	render() {
		const {
			routing: { id, params, query },
		} = this.props;
		const { error } = this.state;

		if (error) {
			return <ScreenError error={error} />;
		}

		const Child = ROUTE_SCREENS[id] || null;

		return Child && <Child {...{ ...params, query }} />;
	}

	static getDerivedStateFromError(error) {
		return { error };
	}
}

export default Screen;
