'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.request = request;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _default = require('./config/default');

var _crossFetch = require('cross-fetch');

var _crossFetch2 = _interopRequireDefault(_crossFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)("promisifiedRequests");

function request(obj) {
  return (0, _crossFetch2.default)(obj.url).then(function (response) {
    if (!response.ok) throw new Error('Network error: ' + response.statusText);
    return response.text();
  });
};