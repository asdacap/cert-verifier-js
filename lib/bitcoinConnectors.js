'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.lookForTx = lookForTx;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _verifierModels = require('./verifierModels');

var _default = require('./config/default');

var _promisifiedRequests = require('./promisifiedRequests');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)("bitcoinConnectors");

require('string.prototype.startswith');

var BlockchainExplorers = [function (transactionId, chain) {
  return getChainSoFetcher(transactionId, chain);
}, function (transactionId, chain) {
  return getBlockcypherFetcher(transactionId, chain);
}];

// for legacy (pre-v2) Blockcerts
var BlockchainExplorersWithSpentOutputInfo = [function (transactionId, chain) {
  return getBlockcypherFetcher(transactionId, chain);
}];

function cleanupRemoteHash(remoteHash) {
  var prefixes = ["6a20", "OP_RETURN "];
  for (var i = 0; i < prefixes.length; i++) {
    var prefix = prefixes[i];
    if (remoteHash.startsWith(prefix)) {
      return remoteHash.slice(prefix.length);
    }
  }
  return remoteHash;
};

function getBlockcypherFetcher(transactionId, chain) {
  var blockCypherUrl = void 0;
  if (chain === _default.Blockchain.bitcoin) {
    blockCypherUrl = _default.Url.blockCypherUrl + transactionId + "?limit=500";
  } else {
    blockCypherUrl = _default.Url.blockCypherTestUrl + transactionId + "?limit=500";
  }
  var blockcypherFetcher = new _promise2.default(function (resolve, reject) {
    return (0, _promisifiedRequests.request)({ url: blockCypherUrl }).then(function (response) {
      var responseData = JSON.parse(response);
      try {
        var txData = parseBlockCypherResponse(responseData);
        resolve(txData);
      } catch (err) {
        // don't need to wrap this exception
        reject(err);
      }
    }).catch(function (err) {
      reject(new _default.VerifierError(err));
    });
  });
  return blockcypherFetcher;
}

function getChainSoFetcher(transactionId, chain) {
  var chainSoUrl = void 0;
  if (chain === _default.Blockchain.bitcoin) {
    chainSoUrl = _default.Url.chainSoUrl + transactionId;
  } else {
    chainSoUrl = _default.Url.chainSoTestUrl + transactionId;
  }

  var chainSoFetcher = new _promise2.default(function (resolve, reject) {
    return (0, _promisifiedRequests.request)({ url: chainSoUrl }).then(function (response) {
      var responseData = JSON.parse(response);
      try {
        var txData = parseChainSoResponse(responseData);
        resolve(txData);
      } catch (err) {
        // don't need to wrap this exception
        reject(err);
      }
    }).catch(function (err) {
      reject(new _default.VerifierError(err));
    });
  });
  return chainSoFetcher;
}

function parseBlockCypherResponse(jsonResponse) {
  if (jsonResponse.confirmations < _default.MininumConfirmations) {
    throw new _default.VerifierError("Number of transaction confirmations were less than the minimum required, according to Blockcypher API");
  }
  var time = Date.parse(jsonResponse.received);
  var outputs = jsonResponse.outputs;
  var lastOutput = outputs[outputs.length - 1];
  var issuingAddress = jsonResponse.inputs[0].addresses[0];
  var opReturnScript = cleanupRemoteHash(lastOutput.script);
  var revokedAddresses = outputs.filter(function (output) {
    return !!output.spent_by;
  }).map(function (output) {
    return output.addresses[0];
  });
  return new _verifierModels.TransactionData(opReturnScript, issuingAddress, time, revokedAddresses);
};

function parseChainSoResponse(jsonResponse) {
  if (jsonResponse.data.confirmations < _default.MininumConfirmations) {
    throw new _default.VerifierError("Number of transaction confirmations were less than the minimum required, according to Chain.so API");
  }
  var time = new Date(jsonResponse.data.time * 1000);
  var outputs = jsonResponse.data.outputs;
  var lastOutput = outputs[outputs.length - 1];
  var issuingAddress = jsonResponse.data.inputs[0].address;
  var opReturnScript = cleanupRemoteHash(lastOutput.script);
  // Legacy v1.2 verification notes:
  // Chain.so requires that you lookup spent outputs per index, which would require potentially a lot of calls. However,
  // this is only for v1.2 so we will allow connectors to omit revoked addresses. Blockcypher returns revoked addresses,
  // and ideally we would provide at least 1 more connector to crosscheck the list of revoked addresses. There were very
  // few v1.2 issuances, but you want to provide v1.2 verification with higher confidence (of cross-checking APIs), then
  // you should consider adding an additional lookup to crosscheck revocation addresses.
  return new _verifierModels.TransactionData(opReturnScript, issuingAddress, time, undefined);
}

function lookForTx(transactionId, chain, certificateVersion) {
  // First ensure we can satisfy the MinimumBlockchainExplorers setting
  if (_default.MinimumBlockchainExplorers < 0 || _default.MinimumBlockchainExplorers > BlockchainExplorers.length) {
    return _promise2.default.reject(new _default.VerifierError("Invalid application configuration; check the MinimumBlockchainExplorers configuration value"));
  }
  if (_default.MinimumBlockchainExplorers > BlockchainExplorersWithSpentOutputInfo.length && (certificateVersion == _default.CertificateVersion.v1_1 || certificateVersion == _default.CertificateVersion.v1_2)) {
    return _promise2.default.reject(new _default.VerifierError("Invalid application configuration; check the MinimumBlockchainExplorers configuration value"));
  }

  // Queue up blockchain explorer APIs
  var promises = Array();
  if (certificateVersion == _default.CertificateVersion.v1_1 || certificateVersion == _default.CertificateVersion.v1_2) {
    var limit = _default.Race ? BlockchainExplorersWithSpentOutputInfo.length : _default.MinimumBlockchainExplorers;
    for (var i = 0; i < limit; i++) {
      promises.push(BlockchainExplorersWithSpentOutputInfo[i](transactionId, chain));
    }
  } else {
    var limit = _default.Race ? BlockchainExplorers.length : _default.MinimumBlockchainExplorers;
    for (var j = 0; j < limit; j++) {
      promises.push(BlockchainExplorers[j](transactionId, chain));
    }
  }

  return new _promise2.default(function (resolve, reject) {
    return properRace(promises, _default.MinimumBlockchainExplorers).then(function (winners) {
      if (!winners || winners.length == 0) {
        return _promise2.default.reject(new _default.VerifierError("Could not confirm the transaction. No blockchain apis returned a response. This could be because of rate limiting."));
      }

      // Compare results returned by different blockchain apis. We pick off the first result and compare the others
      // returned. The number of winners corresponds to the configuration setting `MinimumBlockchainExplorers`.
      // We require that all results agree on `issuingAddress` and `remoteHash`. Not all blockchain apis return
      // spent outputs (revoked addresses for <=v1.2), and we do not have enough coverage to compare this, but we do
      // ensure that a TxData with revoked addresses is returned, for the rare case of legacy 1.2 certificates.
      //
      // Note that APIs returning results where the number of confirmations is less than `MininumConfirmations` are
      // filtered out, but if there are at least `MinimumBlockchainExplorers` reporting that the number of confirmations
      // are above the `MininumConfirmations` threshold, then we can proceed with verification.
      var firstResponse = winners[0];
      for (var i = 1; i < winners.length; i++) {
        var thisResponse = winners[i];
        if (firstResponse.issuingAddress !== thisResponse.issuingAddress) {
          throw new _default.VerifierError("Issuing addresses returned by the blockchain APIs were different");
        }
        if (firstResponse.remoteHash !== thisResponse.remoteHash) {
          throw new _default.VerifierError("Remote hashes returned by the blockchain APIs were different");
        }
      }
      resolve(firstResponse);
    }).catch(function (err) {
      reject(new _default.VerifierError(err));
    });
  });
}

function properRace(promises, count) {
  var results = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  // Source: https://www.jcore.com/2016/12/18/promise-me-you-wont-use-promise-race/
  promises = (0, _from2.default)(promises);
  if (promises.length < count) {
    return _promise2.default.reject(new _default.VerifierError("Could not confirm the transaction"));
  }

  var indexPromises = promises.map(function (p, index) {
    return p.then(function () {
      return index;
    }).catch(function (err) {
      log(err);
      throw index;
    });
  });

  return _promise2.default.race(indexPromises).then(function (index) {
    var p = promises.splice(index, 1)[0];
    p.then(function (e) {
      return results.push(e);
    });
    if (count === 1) {
      return results;
    }
    return properRace(promises, count - 1, results);
  }).catch(function (index) {
    promises.splice(index, 1);
    return properRace(promises, count, results);
  });
};