import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { put, call, cancelled, fork } from 'redux-saga/effects';
import createHistory from 'history/createBrowserHistory';

import {
	reducer as routerReducer,
	saga as routerSaga,
	buildRoutesMap,
	route,
	navigate,
} from 'redux-saga-first-router';

const history = createHistory();

function* navigateASaga(...args) {
	yield call(() => console.log('Navigated to route A'));

	yield fork(navigateASubSaga, ...args);
}

function* navigateASubSaga() {
	yield call(() => console.log('Enter route A sub-saga'));
	try {
		yield call(() => new Promise(() => {})); // halt here
	} finally {
		if (yield cancelled()) {
			yield call(() => console.log('Cancelled route A sub-saga'));
		}
	}
}

function* navigateBSaga(...args) {
	yield call(() => console.log('Navigated to route B', ...args));
}

function* navigateCSaga(...args) {
	yield call(() => console.log('Navigated to route C', ...args));
}

function* queryCSaga(...args) {
	yield call(() => console.log('Query changed in route C', ...args));

	yield fork(queryCSubSaga, ...args);
}

function* queryCSubSaga(params, query) {
	yield call(() => console.log('Enter route C query sub-saga', query));
	try {
		yield call(() => new Promise(() => {})); // halt here
	} finally {
		if (yield cancelled()) {
			yield call(() => console.log('Cancelled route C query sub-saga', query));
		}
	}
}

const routesMap = buildRoutesMap(
	route('A', '/a', navigateASaga),
	route('B', '/b/:timeStamp', navigateBSaga),
	route('C', '/c/:opt?', navigateCSaga, queryCSaga),
	route('_ROOT_', '/', function* navigateRoot() {
		yield put(navigate('A'));
	})
);

const reducer = combineReducers({
	routing: routerReducer,
});

const composeEnhancers =
	(process.env.NODE_ENV === 'development' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
	compose;

const sagaMiddleware = createSagaMiddleware();

const store = createStore(reducer, composeEnhancers(applyMiddleware(sagaMiddleware)));

sagaMiddleware.run(routerSaga, routesMap, history);

ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('root')
);
registerServiceWorker();
