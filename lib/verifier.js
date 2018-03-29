'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificateVerifier = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _certificate = require('./certificate');

var _default = require('./config/default');

var _checks = require('./checks');

var checks = _interopRequireWildcard(_checks);

var _bitcoinConnectors = require('./bitcoinConnectors');

var bitcoinConnectors = _interopRequireWildcard(_bitcoinConnectors);

var _verifierModels = require('./verifierModels');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)("verifier");

require('string.prototype.startswith');

var noop = function noop() {};

var CertificateVerifier = exports.CertificateVerifier = function () {
  function CertificateVerifier(certificateString, statusCallback) {
    (0, _classCallCheck3.default)(this, CertificateVerifier);

    var certificateJson = JSON.parse(certificateString);
    this.certificate = _certificate.Certificate.parseJson(certificateJson);

    var document = certificateJson.document;
    if (!document) {
      var certCopy = JSON.parse(certificateString);
      delete certCopy["signature"];
      document = certCopy;
    }
    this.document = document;
    this.statusCallback = statusCallback || noop;
    // v1.1 only
    this.certificateString = certificateString;
  }

  (0, _createClass3.default)(CertificateVerifier, [{
    key: '_succeed',
    value: function _succeed(completionCallback) {
      var status = void 0;
      if (this.certificate.chain == _default.Blockchain.mocknet || this.certificate.chain == _default.Blockchain.regtest) {
        log("This mock Blockcert passed all checks. Mocknet mode is only used for issuers to test their workflow locally. This Blockcert was not recorded on a blockchain, and it should not be considered a verified Blockcert.");
        status = _default.Status.mockSuccess;
      } else {
        log("success");
        status = _default.Status.success;
      }
      this.statusCallback(status);
      completionCallback(status);
      return status;
    }
  }, {
    key: '_failed',
    value: function _failed(completionCallback, err) {
      log('failure:' + err.message);
      this.statusCallback(_default.Status.failure, err.message);
      completionCallback(_default.Status.failure, err.message);
      return _default.Status.failure;
    }
  }, {
    key: 'doAction',
    value: function doAction(status, action) {
      log((0, _default.getVerboseMessage)(status));
      this.statusCallback(status);
      return action();
    }
  }, {
    key: 'doAsyncAction',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(status, action) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                log((0, _default.getVerboseMessage)(status));
                this.statusCallback(status);
                _context.next = 4;
                return action();

              case 4:
                return _context.abrupt('return', _context.sent);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function doAsyncAction(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return doAsyncAction;
    }()
  }, {
    key: 'getTransactionId',
    value: function getTransactionId() {
      var transactionId = void 0;
      try {
        transactionId = this.certificate.receipt.anchors[0].sourceId;
        return transactionId;
      } catch (e) {
        throw new _default.VerifierError("Can't verify this certificate without a transaction ID to compare against.");
      }
    }
  }, {
    key: 'verifyV1_2',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
        var _this = this;

        var transactionId, docToVerify, localHash, _ref4, _ref5, txData, issuerProfileJson, issuerKeyMap;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                transactionId = this.getTransactionId();
                docToVerify = this.document;
                _context3.next = 4;
                return this.doAsyncAction(_default.Status.computingLocalHash, (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                  return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          return _context2.abrupt('return', checks.computeLocalHash(docToVerify, _this.certificate.version));

                        case 1:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _callee2, _this);
                })));

              case 4:
                localHash = _context3.sent;
                _context3.next = 7;
                return _promise2.default.all([bitcoinConnectors.lookForTx(transactionId, this.certificate.chain, this.certificate.version), (0, _verifierModels.getIssuerProfile)(this.certificate.issuer.id)]);

              case 7:
                _ref4 = _context3.sent;
                _ref5 = (0, _slicedToArray3.default)(_ref4, 2);
                txData = _ref5[0];
                issuerProfileJson = _ref5[1];
                issuerKeyMap = (0, _verifierModels.parseIssuerKeys)(issuerProfileJson);


                this.doAction(_default.Status.comparingHashes, function () {
                  return checks.ensureHashesEqual(localHash, _this.certificate.receipt.targetHash);
                });
                this.doAction(_default.Status.checkingMerkleRoot, function () {
                  return checks.ensureMerkleRootEqual(_this.certificate.receipt.merkleRoot, txData.remoteHash);
                });
                this.doAction(_default.Status.checkingReceipt, function () {
                  return checks.ensureValidReceipt(_this.certificate.receipt);
                });
                this.doAction(_default.Status.checkingRevokedStatus, function () {
                  return checks.ensureNotRevokedBySpentOutput(txData.revokedAddresses, (0, _verifierModels.parseRevocationKey)(issuerProfileJson), _this.certificate.revocationKey);
                });
                this.doAction(_default.Status.checkingAuthenticity, function () {
                  return checks.ensureValidIssuingKey(issuerKeyMap, txData.issuingAddress, txData.time);
                });
                this.doAction(_default.Status.checkingExpiresDate, function () {
                  return checks.ensureNotExpired(_this.certificate.expires);
                });

              case 18:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function verifyV1_2() {
        return _ref2.apply(this, arguments);
      }

      return verifyV1_2;
    }()
  }, {
    key: 'verifyV2',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
        var _this2 = this;

        var transactionId, docToVerify, localHash, _ref8, _ref9, txData, issuerKeyMap, revokedAssertions;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                transactionId = this.getTransactionId();
                docToVerify = this.document;
                _context5.next = 4;
                return this.doAsyncAction(_default.Status.computingLocalHash, (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
                  return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          return _context4.abrupt('return', checks.computeLocalHash(docToVerify, _this2.certificate.version));

                        case 1:
                        case 'end':
                          return _context4.stop();
                      }
                    }
                  }, _callee4, _this2);
                })));

              case 4:
                localHash = _context5.sent;
                _context5.next = 7;
                return _promise2.default.all([bitcoinConnectors.lookForTx(transactionId, this.certificate.chain), (0, _verifierModels.getIssuerKeys)(this.certificate.issuer.id), (0, _verifierModels.getRevokedAssertions)(this.certificate.issuer.revocationList)]);

              case 7:
                _ref8 = _context5.sent;
                _ref9 = (0, _slicedToArray3.default)(_ref8, 3);
                txData = _ref9[0];
                issuerKeyMap = _ref9[1];
                revokedAssertions = _ref9[2];


                this.doAction(_default.Status.comparingHashes, function () {
                  return checks.ensureHashesEqual(localHash, _this2.certificate.receipt.targetHash);
                });
                this.doAction(_default.Status.checkingMerkleRoot, function () {
                  return checks.ensureMerkleRootEqual(_this2.certificate.receipt.merkleRoot, txData.remoteHash);
                });
                this.doAction(_default.Status.checkingReceipt, function () {
                  return checks.ensureValidReceipt(_this2.certificate.receipt);
                });
                this.doAction(_default.Status.checkingRevokedStatus, function () {
                  return checks.ensureNotRevokedByList(revokedAssertions, _this2.certificate.id);
                });
                this.doAction(_default.Status.checkingAuthenticity, function () {
                  return checks.ensureValidIssuingKey(issuerKeyMap, txData.issuingAddress, txData.time);
                });
                this.doAction(_default.Status.checkingExpiresDate, function () {
                  return checks.ensureNotExpired(_this2.certificate.expires);
                });

              case 18:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function verifyV2() {
        return _ref6.apply(this, arguments);
      }

      return verifyV2;
    }()
  }, {
    key: 'verifyV2Mock',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
        var _this3 = this;

        var docToVerify, localHash;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                docToVerify = this.document;
                _context7.next = 3;
                return this.doAsyncAction(_default.Status.computingLocalHash, (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
                  return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          return _context6.abrupt('return', checks.computeLocalHash(docToVerify, _this3.certificate.version));

                        case 1:
                        case 'end':
                          return _context6.stop();
                      }
                    }
                  }, _callee6, _this3);
                })));

              case 3:
                localHash = _context7.sent;


                this.doAction(_default.Status.comparingHashes, function () {
                  return checks.ensureHashesEqual(localHash, _this3.certificate.receipt.targetHash);
                });
                this.doAction(_default.Status.checkingReceipt, function () {
                  return checks.ensureValidReceipt(_this3.certificate.receipt);
                });
                this.doAction(_default.Status.checkingExpiresDate, function () {
                  return checks.ensureNotExpired(_this3.certificate.expires);
                });

              case 7:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function verifyV2Mock() {
        return _ref10.apply(this, arguments);
      }

      return verifyV2Mock;
    }()
  }, {
    key: 'verify',
    value: function () {
      var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(completionCallback) {
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (!(this.certificate.version == _default.CertificateVersion.v1_1)) {
                  _context8.next = 2;
                  break;
                }

                throw new _default.VerifierError("Verification of 1.1 certificates is not supported by this component. See the python cert-verifier for legacy verification");

              case 2:
                completionCallback = completionCallback || noop;
                _context8.prev = 3;

                if (!(this.certificate.version == _default.CertificateVersion.v1_2)) {
                  _context8.next = 9;
                  break;
                }

                _context8.next = 7;
                return this.verifyV1_2();

              case 7:
                _context8.next = 16;
                break;

              case 9:
                if (!(this.certificate.chain == _default.Blockchain.mocknet || this.certificate.chain == _default.Blockchain.regtest)) {
                  _context8.next = 14;
                  break;
                }

                _context8.next = 12;
                return this.verifyV2Mock();

              case 12:
                _context8.next = 16;
                break;

              case 14:
                _context8.next = 16;
                return this.verifyV2();

              case 16:
                return _context8.abrupt('return', this._succeed(completionCallback));

              case 19:
                _context8.prev = 19;
                _context8.t0 = _context8['catch'](3);

                if (!(_context8.t0 instanceof _default.VerifierError)) {
                  _context8.next = 23;
                  break;
                }

                return _context8.abrupt('return', this._failed(completionCallback, _context8.t0));

              case 23:
                throw _context8.t0;

              case 24:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this, [[3, 19]]);
      }));

      function verify(_x3) {
        return _ref12.apply(this, arguments);
      }

      return verify;
    }()
  }]);
  return CertificateVerifier;
}();