'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Key = exports.TransactionData = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

exports.parseIssuerKeys = parseIssuerKeys;
exports.parseRevocationKey = parseRevocationKey;
exports.getIssuerProfile = getIssuerProfile;
exports.getIssuerKeys = getIssuerKeys;
exports.getRevokedAssertions = getRevokedAssertions;

var _promisifiedRequests = require('./promisifiedRequests');

var _default = require('./config/default');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TransactionData = exports.TransactionData = function TransactionData(remoteHash, issuingAddress, time, revokedAddresses) {
  (0, _classCallCheck3.default)(this, TransactionData);

  this.remoteHash = remoteHash;
  this.issuingAddress = issuingAddress;
  this.time = time;
  this.revokedAddresses = revokedAddresses;
};

var Key = exports.Key = function Key(publicKey, created, revoked, expires) {
  (0, _classCallCheck3.default)(this, Key);

  this.publicKey = publicKey;
  this.created = created;
  this.revoked = revoked;
  this.expires = expires;
};

function parseIssuerKeys(issuerProfileJson) {
  try {
    var keyMap = {};
    if ('@context' in issuerProfileJson) {
      // backcompat for v2 alpha
      var responseKeys = issuerProfileJson.publicKey || issuerProfileJson.publicKeys;
      for (var i = 0; i < responseKeys.length; i++) {
        var key = responseKeys[i];
        var created = key.created ? Date.parse(key.created) : null;
        var revoked = key.revoked ? Date.parse(key.revoked) : null;
        var expires = key.expires ? Date.parse(key.expires) : null;
        // backcompat for v2 alpha
        var publicKeyTemp = key.id || key.publicKey;
        var publicKey = publicKeyTemp.replace('ecdsa-koblitz-pubkey:', '');
        var k = new Key(publicKey, created, revoked, expires);
        keyMap[k.publicKey] = k;
      }
    } else {
      // This is a v2 certificate with a v1 issuer
      var issuerKeys = issuerProfileJson.issuerKeys || [];
      var issuerKey = issuerKeys[0].key;
      var k = new Key(issuerKey, null, null, null);
      keyMap[k.publicKey] = k;
    }
    return keyMap;
  } catch (e) {
    throw new _default.VerifierError(e, "Unable to parse JSON out of issuer identification data.");
  }
};

function parseRevocationKey(issuerProfileJson) {
  if (issuerProfileJson.revocationKeys && issuerProfileJson.revocationKeys.length > 0) {
    return issuerProfileJson.revocationKeys[0].key;
  }
  return null;
}

function getIssuerProfile(issuerId) {
  var issuerProfileFetcher = new _promise2.default(function (resolve, reject) {
    return (0, _promisifiedRequests.request)({ url: issuerId }).then(function (response) {
      try {
        var issuerProfileJson = JSON.parse(response);
        resolve(issuerProfileJson);
      } catch (err) {
        reject(new _default.VerifierError(err));
      }
    }).catch(function (err) {
      reject(new _default.VerifierError(err));
    });
  });
  return issuerProfileFetcher;
}

function getIssuerKeys(issuerId) {
  var issuerKeyFetcher = new _promise2.default(function (resolve, reject) {
    return getIssuerProfile(issuerId).then(function (issuerProfileJson) {
      try {
        var issuerKeyMap = parseIssuerKeys(issuerProfileJson);
        resolve(issuerKeyMap);
      } catch (err) {
        reject(new _default.VerifierError(err));
      }
    }).catch(function (err) {
      reject(new _default.VerifierError(err));
    });
  });
  return issuerKeyFetcher;
}

function getRevokedAssertions(revocationListUrl) {
  if (!revocationListUrl) {
    return _promise2.default.resolve([]);
  }
  var revocationListFetcher = new _promise2.default(function (resolve, reject) {
    return (0, _promisifiedRequests.request)({ url: revocationListUrl }).then(function (response) {
      try {
        var issuerRevocationJson = JSON.parse(response);
        var revokedAssertions = issuerRevocationJson.revokedAssertions ? issuerRevocationJson.revokedAssertions : [];
        resolve(revokedAssertions);
      } catch (err) {
        reject(new _default.VerifierError(err));
      }
    }).catch(function (err) {
      reject(new _default.VerifierError(err));
    });
  });
  return revocationListFetcher;
}