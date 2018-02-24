'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificateVerifier = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = (0, _debug2.default)("verifier");

require('string.prototype.startswith');

var noop = function noop() {};

var CertificateVerifier = exports.CertificateVerifier = function () {
  function CertificateVerifier(certificateString, statusCallback) {
    _classCallCheck(this, CertificateVerifier);

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

  _createClass(CertificateVerifier, [{
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
    value: async function doAsyncAction(status, action) {
      log((0, _default.getVerboseMessage)(status));
      this.statusCallback(status);
      return await action();
    }
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
    value: async function verifyV1_2() {
      var _this = this;

      var transactionId = this.getTransactionId();
      var docToVerify = this.document;

      var localHash = await this.doAsyncAction(_default.Status.computingLocalHash, async function () {
        return checks.computeLocalHash(docToVerify, _this.certificate.version);
      });

      var _ref = await Promise.all([bitcoinConnectors.lookForTx(transactionId, this.certificate.chain, this.certificate.version), (0, _verifierModels.getIssuerProfile)(this.certificate.issuer.id)]),
          _ref2 = _slicedToArray(_ref, 2),
          txData = _ref2[0],
          issuerProfileJson = _ref2[1];

      var issuerKeyMap = (0, _verifierModels.parseIssuerKeys)(issuerProfileJson);

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
    }
  }, {
    key: 'verifyV2',
    value: async function verifyV2() {
      var _this2 = this;

      var transactionId = this.getTransactionId();
      var docToVerify = this.document;

      var localHash = await this.doAsyncAction(_default.Status.computingLocalHash, async function () {
        return checks.computeLocalHash(docToVerify, _this2.certificate.version);
      });

      var _ref3 = await Promise.all([bitcoinConnectors.lookForTx(transactionId, this.certificate.chain), (0, _verifierModels.getIssuerKeys)(this.certificate.issuer.id), (0, _verifierModels.getRevokedAssertions)(this.certificate.issuer.revocationList)]),
          _ref4 = _slicedToArray(_ref3, 3),
          txData = _ref4[0],
          issuerKeyMap = _ref4[1],
          revokedAssertions = _ref4[2];

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
    }
  }, {
    key: 'verifyV2Mock',
    value: async function verifyV2Mock() {
      var _this3 = this;

      var docToVerify = this.document;
      var localHash = await this.doAsyncAction(_default.Status.computingLocalHash, async function () {
        return checks.computeLocalHash(docToVerify, _this3.certificate.version);
      });

      this.doAction(_default.Status.comparingHashes, function () {
        return checks.ensureHashesEqual(localHash, _this3.certificate.receipt.targetHash);
      });
      this.doAction(_default.Status.checkingReceipt, function () {
        return checks.ensureValidReceipt(_this3.certificate.receipt);
      });
      this.doAction(_default.Status.checkingExpiresDate, function () {
        return checks.ensureNotExpired(_this3.certificate.expires);
      });
    }
  }, {
    key: 'verify',
    value: async function verify(completionCallback) {
      if (this.certificate.version == _default.CertificateVersion.v1_1) {
        throw new _default.VerifierError("Verification of 1.1 certificates is not supported by this component. See the python cert-verifier for legacy verification");
      }
      completionCallback = completionCallback || noop;
      try {
        if (this.certificate.version == _default.CertificateVersion.v1_2) {
          await this.verifyV1_2();
        } else if (this.certificate.chain == _default.Blockchain.mocknet || this.certificate.chain == _default.Blockchain.regtest) {
          await this.verifyV2Mock();
        } else {
          await this.verifyV2();
        }

        return this._succeed(completionCallback);
      } catch (e) {
        if (e instanceof _default.VerifierError) {
          return this._failed(completionCallback, e);
        }
        throw e;
      }
    }
  }]);

  return CertificateVerifier;
}();