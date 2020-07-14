import React from 'react';
import logo from './logo.svg';
import './App.css';

import Screen from './Screen';

import { connect } from 'react-redux';
import { navigate } from 'redux-saga-first-router';

function App({ routing, onNavigate }) {
	const onGotoA = () => onNavigate('A');
	const onGotoB = () => onNavigate('B', { timeStamp: Date.now() + '' });
	const onGotoC = () => onNavigate('C', {}, { query: { q: 'query', ts: Date.now() + '' } });
	const onGotoCOpt = () => onNavigate('C', { opt: 'foo' }, { query: { ts: Date.now() + '' } });

	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<h1 className="App-title">Welcome to Redux Saga First Router</h1>
			</header>
			<nav className="App-nav">
				<button onClick={onGotoA}>Goto A</button>
				<button onClick={onGotoB}>Goto B</button>
				<button onClick={onGotoC}>Goto C</button>
				<button onClick={onGotoCOpt}>Goto C with Opt</button>
			</nav>
			<ul className="App-routing">
				<li>Route: {routing.id}</li>
				<li>Parameters: {JSON.stringify(routing.params)}</li>
				<li>Query: {JSON.stringify(routing.query)}</li>
			</ul>
			<Screen routing={routing} />
		</div>
	);
}

export default connect(
	state => ({ routing: state.routing }),
	dispatch => ({ onNavigate: (...args) => dispatch(navigate(...args)) })
)(App);
