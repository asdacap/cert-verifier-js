'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.request = request;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _default = require('./config/default');

require('isomorphic-fetch');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)("promisifiedRequests");

function request(obj) {
  return fetch(obj.url).then(function (response) {
    if (!response.ok) throw new Error('Network error: ' + response.statusText);
    return response.text();
  });
};