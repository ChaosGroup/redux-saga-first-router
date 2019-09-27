# "Saga First" Router for React/Redux/Saga Projects

This router is inspired by best parts of [redux-saga-router](https://github.com/jfairbank/redux-saga-router) and [redux-first-router](https://github.com/faceyspacey/redux-first-router). A rather long introduction about the reasoning behind can be found at [Pre Release: Redux-First Router — A Step Beyond Redux-Little-Router](https://medium.com/faceyspacey/pre-release-redux-first-router-a-step-beyond-redux-little-router-cd2716576aea), but you can choose to just believe us a read further :)

## Install

```
yarn add redux-saga-first-router history
```

## Setup

Keeping browser URL in sync with `redux` state and activating/deactivating application behavior per screen level is handled by [redux-saga](https://github.com/redux-saga/redux-saga).

Router `reducer` is registered as usual in `combineReducers` block. Router `saga` is our workhorse which is registered with `redux-saga` middleware after all other `saga`-s and is initialized with application `routesMap` and instance of `history` helper.

```js
import { createBrowserHistory } from 'history';
import {
	reducer as routerReducer,
	saga as routerSaga,
	buildRoutesMap,
	route,
} from 'redux-saga-first-router';

// matched from top to bottom
// less specific routes should appear later
// provided sagas are activated/deactivated on matched route
const routesMap = buildRoutesMap(
	route('PROJECT', '/portal/projects/:projectName', projectNavigate),
	route('PROJECTS', '/portal/projects', projectsNavigate, projectsQuery),
	route('DOWNLOAD', '/portal/download')
	// ...
);

const history = createBrowserHistory();

const reducer = combineReducers({
	// ... other reducers
	routing: routerReducer,
});

// ... store and saga middleware setup

// other sagas ...

// routerSaga is registered last
sagaMiddleware.run(routerSaga, routesMap, history);
```

## Usage

### Routes Map

`routesMap` is ordered map of `route`-s defined in our application. `route` helper is just shorthand to generate the following data structure

```js
{
    id: 'PROJECTS',
    path: '/portal/projects',
    navigateSaga: projectNavigate,
    querySaga: projectsQuery
}
```

-   _`id: {string}`_ - should be unique and is part of all `dispatch`-ed `redux` actions.
-   _`path: {string}`_ - Express-style path definition, for reference check [Path-to-RegExp](https://github.com/pillarjs/path-to-regexp) documentation (only paths are supported, no query strings).
-   _`navigateSaga: {function*}`_ - [optional] `saga` that will be `fork`-ed when navigated to matching route and `cancel`-ed when navigated away.
-   _`querySaga: {function*}`_ - [optional] `saga` that will be `fork`-ed when query is changed.

Routes are evaluated from top to bottom until URL match is found, this requires routes to be ordered from more to less specific.

`routesMap` is used to provide data for two essential functions:

-   _URL -> Action_ - When URL is entered in browser address bar (or Back/Forward buttons are used) a scan trough `routesMap` tries to find match and when found an action is dispatched

```js
{
    type: 'router/NAVIGATE',
    id: 'PROJECT',
    params: { projectName: 'Project 123' },
    query: { mode: 'grid' }
}
```

-   _Action -> URL_ - When `NAVIGATE` action is dispatched by our code a matching route by `id` is used to generate the corresponding URL and is `push/replace`-ed in browser history.

```js
import { navigate } from 'redux-saga-first-router';

const mapDispatchToProps = dispatch => {
	return {
		// ...
		onSelectProject(projectName) {
			dispatch(navigate('PROJECT', { projectName }, { query: { mode: 'grid' } }));
		},
		onProjectDeleted() {
			dispatch(navigate('PROJECTS', {}, { replace: true }));
		},
		// ...
	};
};
```

Where `navigate` is small action creator helper. The third parameter can be used to pass additional options, currently supported are:

-   _`replace: {boolean}`_ - instructs the router to use `replace` instead of `push` method on history update.
-   _`force: {boolean}`_ - instructs the router to force new saga fork even if navigate action is the same as current route.
-   _`query: {object}`_ - appends query string parameters to generated URL, these will be passed later as second parameter of activated navigate & query saga.

Query string parameters are unordered/arbitrary data, they are always optional and not considered in route matching.

## All navigation in our application is now controlled by **just dispatching redux actions**, browser URL and history manipulation are handled automatically and **only by the router** ! If you want to react on navigation event, use registered route **saga**!

### React routing component

Once we have in place the router reducer and saga we can create our React component that will render relevant React sub-components per route. This can be simple stateless React component `connected` to our `routing` state.

```js
import React from 'react';

import { connect } from 'react-redux';

import ProjectView from './screens/project-view';
import ProjectList from './screens/project-list';
import NotFound from './screens/not-found';

const Screen = ({ id, params }) =>
	(({
		PROJECT: () => <ProjectView projectName={params.projectName} />,
		PROJECTS: () => <ProjectList />,
	}[id] || (() => <NotFound />))());

export default connect(state => state.routing)(Screen);
```

This example uses js object to map route `id` to React sub-components. Notice that we use functions as map values, this way we will create instances only for route matching React components. The structure of this component is entirely up to your project and you may decide to split it even further.

Directly using `redux routing` state beside main React routing component is rare, as `saga`-s are activated/deactivated per route with all relevant data.

### Navigate sagas

The third parameter in our `route` definition is optional `saga` function, as we already mentioned this `saga` will be activated once our application navigates to this `route` and will be `cancel`-ed when navigated away.

```js
export function* projectNavigate(params, query) {
	const { projectName } = params;
	const { mode } = query;

	// sub-saga active only for current route
	yield fork(watchProjectRename);

	// prepare initial state
	yield put(clearStore());

	if (mode) {
		yield put(setViewMode(mode));
	}

	try {
		// poll for changes every 3 seconds
		while (true) {
			// load current project
			yield put(getProject(projectName));
			yield call(delay, 3000);
		}
	} finally {
		if (yield cancelled()) {
			// cleanup on navigating away
			yield put(clearStore());
		}
	}
}
```

Here we will receive passed parameters and can initialize sub-sagas that are relevant only for the lifespan of this route, as opposite to application level sagas that are registered with saga middleware. Also we have chance to clear after application navigates away and all `fork`-ed sagas will be `cancel`-ed automatically.
