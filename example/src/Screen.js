import React, { Component } from 'react';

class ScreenA extends Component {
	render() {
		return <p>Hello from A screen</p>;
	}
}

class ScreenB extends Component {
	render() {
		return <p>Hello from B screen</p>;
	}
}

class ScreenC extends Component {
	render() {
		return <p>Hello from C screen</p>;
	}
}

class Screen extends Component {
	render() {
		const { routing: { id, params, query } } = this.props;
		return ({
			A: () => <ScreenA />,
			B: () => <ScreenB {...params} />,
			C: () => <ScreenC {...params} query={query} />,
		}[id] || (() => null))();
	}
}

export default Screen;
