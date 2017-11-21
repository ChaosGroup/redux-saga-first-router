'use strict';

exports.__esModule = true;
exports.NAVIGATE = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.navigate = navigate;
exports.route = route;
exports.buildRoutesMap = buildRoutesMap;
exports.reducer = reducer;
exports.actionToPath = actionToPath;
exports.pathToAction = pathToAction;
exports.createHistoryChannel = createHistoryChannel;
exports.onNavigate = onNavigate;
exports.routeSaga = routeSaga;
exports.historyToStore = historyToStore;
exports.storeToHistory = storeToHistory;
exports.saga = saga;

var _reduxSaga = require('redux-saga');

var _effects = require('redux-saga/effects');

var _pathToRegexp = require('path-to-regexp');

var _pathToRegexp2 = _interopRequireDefault(_pathToRegexp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = /*#__PURE__*/_regenerator2.default.mark(onNavigate),
    _marked2 = /*#__PURE__*/_regenerator2.default.mark(routeSaga),
    _marked3 = /*#__PURE__*/_regenerator2.default.mark(historyToStore),
    _marked4 = /*#__PURE__*/_regenerator2.default.mark(storeToHistory),
    _marked5 = /*#__PURE__*/_regenerator2.default.mark(saga);

var NAVIGATE = exports.NAVIGATE = 'router/NAVIGATE';

function navigate(id) {
	var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	return (0, _extends3.default)({ type: NAVIGATE, id: id, params: params }, opts);
}

function route(id, path, saga) {
	return { id: id, path: path, saga: saga };
}

function buildRoutesMap() {
	for (var _len = arguments.length, routes = Array(_len), _key = 0; _key < _len; _key++) {
		routes[_key] = arguments[_key];
	}

	return new _map2.default(routes.map(function (_ref) {
		var id = _ref.id,
		    path = _ref.path,
		    saga = _ref.saga;

		var keys = [];
		var re = (0, _pathToRegexp2.default)(path, keys);
		var toPath = _pathToRegexp2.default.compile(path);
		return [id, { id: id, path: path, saga: saga, re: re, keys: keys, toPath: toPath }];
	}));
}

var initialState = {
	id: null,
	path: null,
	params: null,
	prev: null
};

function reducer() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
	var action = arguments[1];

	if (action.type === NAVIGATE) {
		return {
			id: action.id,
			params: action.params,
			path: action.path || null,
			prev: state.id && (0, _extends3.default)({}, state, {
				prev: null
			})
		};
	}
	return state;
}

function actionToPath(routesMap, action) {
	var route = routesMap.get(action && action.id) || null;
	return route && route.toPath(action.params);
}

function pathToAction(routesMap, path) {
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
			v: navigate(id, (0, _extends3.default)({}, params, state))
		};
	};

	_loop2: for (var _iterator = routesMap.entries(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
		var _ref2;

		var _ret = _loop();

		switch (_ret) {
			case 'break':
				break _loop2;

			case 'continue':
				continue;

			default:
				if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
		}
	}

	return navigate('NOT_FOUND');
}

function createHistoryChannel(history) {
	return (0, _reduxSaga.eventChannel)(function (emitter) {
		emitter({ location: history.location });

		var ignore = history.listen(function (location, action) {
			emitter({ location: location, action: action });
		});

		return function () {
			ignore();
		};
	}, _reduxSaga.buffers.fixed());
}

function onNavigate(routesMap, _ref4) {
	var id = _ref4.id,
	    params = _ref4.params;
	var r;
	return _regenerator2.default.wrap(function onNavigate$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					r = routesMap.get(id);

					if (!(r && r.saga)) {
						_context.next = 4;
						break;
					}

					_context.next = 4;
					return (0, _effects.fork)(r.saga, params);

				case 4:
				case 'end':
					return _context.stop();
			}
		}
	}, _marked, this);
}

function routeSaga(routesMap) {
	return _regenerator2.default.wrap(function routeSaga$(_context2) {
		while (1) {
			switch (_context2.prev = _context2.next) {
				case 0:
					_context2.next = 2;
					return (0, _effects.takeLatest)(NAVIGATE, onNavigate, routesMap);

				case 2:
				case 'end':
					return _context2.stop();
			}
		}
	}, _marked2, this);
}

function historyToStore(routesMap, historyChannel) {
	var _ref5, location, action, navigateAction;

	return _regenerator2.default.wrap(function historyToStore$(_context3) {
		while (1) {
			switch (_context3.prev = _context3.next) {
				case 0:
					if (!true) {
						_context3.next = 12;
						break;
					}

					_context3.next = 3;
					return (0, _effects.take)(historyChannel);

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
					return (0, _effects.put)(navigateAction);

				case 10:
					_context3.next = 0;
					break;

				case 12:
				case 'end':
					return _context3.stop();
			}
		}
	}, _marked3, this);
}

function storeToHistory(routesMap, history) {
	var navigateAction, navigatePath, currentAction, currentPath;
	return _regenerator2.default.wrap(function storeToHistory$(_context4) {
		while (1) {
			switch (_context4.prev = _context4.next) {
				case 0:
					if (!true) {
						_context4.next = 10;
						break;
					}

					_context4.next = 3;
					return (0, _effects.take)(NAVIGATE);

				case 3:
					navigateAction = _context4.sent;
					navigatePath = actionToPath(routesMap, navigateAction);
					currentAction = pathToAction(routesMap, history.location.pathname);
					currentPath = actionToPath(routesMap, currentAction); // normalized

					if (navigatePath && navigatePath !== currentPath) {
						history[navigateAction.replace ? 'replace' : 'push'](navigatePath, (0, _extends3.default)({}, navigateAction.params));
					}
					_context4.next = 0;
					break;

				case 10:
				case 'end':
					return _context4.stop();
			}
		}
	}, _marked4, this);
}

function saga(routesMap, history) {
	var historyChannel;
	return _regenerator2.default.wrap(function saga$(_context5) {
		while (1) {
			switch (_context5.prev = _context5.next) {
				case 0:
					_context5.next = 2;
					return (0, _effects.fork)(routeSaga, routesMap);

				case 2:
					_context5.next = 4;
					return (0, _effects.fork)(storeToHistory, routesMap, history);

				case 4:
					_context5.next = 6;
					return (0, _effects.call)(createHistoryChannel, history);

				case 6:
					historyChannel = _context5.sent;
					_context5.next = 9;
					return (0, _effects.fork)(historyToStore, routesMap, historyChannel);

				case 9:
				case 'end':
					return _context5.stop();
			}
		}
	}, _marked5, this);
}