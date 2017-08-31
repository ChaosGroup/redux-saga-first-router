import _regeneratorRuntime from 'babel-runtime/regenerator';
import _typeof from 'babel-runtime/helpers/typeof';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _extends from 'babel-runtime/helpers/extends';

var _marked = [onNavigate, routeSaga, historyToStore, storeToHistory, saga].map(_regeneratorRuntime.mark);

import { eventChannel, buffers } from 'redux-saga';
import { take, put, all, call, takeLatest, fork } from 'redux-saga/effects';
import pathToRegexp from 'path-to-regexp';

export var NAVIGATE = 'router/NAVIGATE';

export function navigate(id) {
	var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	return _extends({ type: NAVIGATE, id: id, params: params }, opts);
}

export function route(id, path, saga) {
	return { id: id, path: path, saga: saga };
}

export function buildRoutesMap() {
	for (var _len = arguments.length, routes = Array(_len), _key = 0; _key < _len; _key++) {
		routes[_key] = arguments[_key];
	}

	return new _Map(routes.map(function (_ref) {
		var id = _ref.id,
		    path = _ref.path,
		    saga = _ref.saga;

		var keys = [];
		var re = pathToRegexp(path, keys);
		var toPath = pathToRegexp.compile(path);
		return [id, { id: id, path: path, saga: saga, re: re, keys: keys, toPath: toPath }];
	}));
}

var initialState = {
	id: null,
	path: null,
	params: null,
	prev: null
};

export function reducer() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
	var action = arguments[1];

	if (action.type === NAVIGATE) {
		return {
			id: action.id,
			params: action.params,
			path: action.path || null,
			prev: state.id && _extends({}, state, {
				prev: null
			})
		};
	}
	return state;
}

export function actionToPath(routesMap, action) {
	var route = routesMap.get(action && action.id) || null;
	return route && route.toPath(action.params);
}

export function pathToAction(routesMap, path) {
	var state = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	if (!path || typeof path !== 'string') {
		return null;
	}

	var _loop = function _loop() {
		if (_isArray) {
			if (_i >= _iterator.length) return 'break';
			_ref2 = _iterator[_i++];
		} else {
			_i = _iterator.next();
			if (_i.done) return 'break';
			_ref2 = _i.value;
		}

		var _ref3 = _ref2,
		    id = _ref3[0],
		    route = _ref3[1];

		var captures = path.match(route.re);
		if (!captures) {
			return 'continue';
		}

		var params = captures.slice(1).reduce(function (params, capture, index) {
			var key = route.keys[index];
			var value = typeof capture === 'string' ? decodeURIComponent(capture) : capture;

			params[key.name] = value;

			return params;
		}, {});

		return {
			v: navigate(id, _extends({}, params, state))
		};
	};

	_loop2: for (var _iterator = routesMap.entries(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
		var _ref2;

		var _ret = _loop();

		switch (_ret) {
			case 'break':
				break _loop2;

			case 'continue':
				continue;

			default:
				if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
		}
	}

	return navigate('NOT_FOUND');
}

export function createHistoryChannel(history) {
	return eventChannel(function (emitter) {
		emitter({ location: history.location });

		var ignore = history.listen(function (location, action) {
			emitter({ location: location, action: action });
		});

		return function () {
			ignore();
		};
	}, buffers.fixed());
}

export function onNavigate(routesMap, _ref4) {
	var id = _ref4.id,
	    params = _ref4.params;
	var r;
	return _regeneratorRuntime.wrap(function onNavigate$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					r = routesMap.get(id);

					if (!(r && r.saga)) {
						_context.next = 4;
						break;
					}

					_context.next = 4;
					return fork(r.saga, params);

				case 4:
				case 'end':
					return _context.stop();
			}
		}
	}, _marked[0], this);
}

export function routeSaga(routesMap) {
	return _regeneratorRuntime.wrap(function routeSaga$(_context2) {
		while (1) {
			switch (_context2.prev = _context2.next) {
				case 0:
					_context2.next = 2;
					return takeLatest(NAVIGATE, onNavigate, routesMap);

				case 2:
				case 'end':
					return _context2.stop();
			}
		}
	}, _marked[1], this);
}

export function historyToStore(routesMap, historyChannel) {
	var _ref5, location, action, navigateAction;

	return _regeneratorRuntime.wrap(function historyToStore$(_context3) {
		while (1) {
			switch (_context3.prev = _context3.next) {
				case 0:
					if (!true) {
						_context3.next = 12;
						break;
					}

					_context3.next = 3;
					return take(historyChannel);

				case 3:
					_ref5 = _context3.sent;
					location = _ref5.location;
					action = _ref5.action;

					if (!(!action || action === 'POP')) {
						_context3.next = 10;
						break;
					}

					navigateAction = pathToAction(routesMap, location.pathname, location.state);
					_context3.next = 10;
					return put(navigateAction);

				case 10:
					_context3.next = 0;
					break;

				case 12:
				case 'end':
					return _context3.stop();
			}
		}
	}, _marked[2], this);
}

export function storeToHistory(routesMap, history) {
	var navigateAction, navigatePath, currentAction, currentPath;
	return _regeneratorRuntime.wrap(function storeToHistory$(_context4) {
		while (1) {
			switch (_context4.prev = _context4.next) {
				case 0:
					if (!true) {
						_context4.next = 10;
						break;
					}

					_context4.next = 3;
					return take(NAVIGATE);

				case 3:
					navigateAction = _context4.sent;
					navigatePath = actionToPath(routesMap, navigateAction);
					currentAction = pathToAction(routesMap, history.location.pathname);
					currentPath = actionToPath(routesMap, currentAction); // normalized

					if (navigatePath && navigatePath !== currentPath) {
						history[navigateAction.replace ? 'replace' : 'push'](navigatePath, _extends({}, navigateAction.params));
					}
					_context4.next = 0;
					break;

				case 10:
				case 'end':
					return _context4.stop();
			}
		}
	}, _marked[3], this);
}

export function saga(routesMap, history) {
	var historyChannel;
	return _regeneratorRuntime.wrap(function saga$(_context5) {
		while (1) {
			switch (_context5.prev = _context5.next) {
				case 0:
					_context5.next = 2;
					return call(createHistoryChannel, history);

				case 2:
					historyChannel = _context5.sent;
					_context5.next = 5;
					return all([call(routeSaga, routesMap), call(historyToStore, routesMap, historyChannel), call(storeToHistory, routesMap, history)]);

				case 5:
				case 'end':
					return _context5.stop();
			}
		}
	}, _marked[4], this);
}