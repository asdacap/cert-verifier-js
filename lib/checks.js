'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.ensureNotRevokedBySpentOutput = ensureNotRevokedBySpentOutput;
exports.ensureNotRevokedByList = ensureNotRevokedByList;
exports.ensureIssuerSignature = ensureIssuerSignature;
exports.ensureHashesEqual = ensureHashesEqual;
exports.ensureMerkleRootEqual = ensureMerkleRootEqual;
exports.ensureValidIssuingKey = ensureValidIssuingKey;
exports.ensureValidReceipt = ensureValidReceipt;
exports.computeLocalHashV1_1 = computeLocalHashV1_1;
exports.computeLocalHash = computeLocalHash;
exports.ensureNotExpired = ensureNotExpired;

var _bitcoinjsLib = require('bitcoinjs-lib');

var _bitcoinjsLib2 = _interopRequireDefault(_bitcoinjsLib);

var _jsonld = require('jsonld');

var _jsonld2 = _interopRequireDefault(_jsonld);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _default = require('./config/default');

var _sha = require('sha256');

var _sha2 = _interopRequireDefault(_sha);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)("checks");

require('string.prototype.startswith');

var OBI_CONTEXT = _default.Contexts.obi,
    BLOCKCERTS_CONTEXT = _default.Contexts.blockcerts,
    BLOCKCERTSV1_2_CONTEXT = _default.Contexts.blockcertsv1_2,
    BLOCKCERTSV2_CONTEXT = _default.Contexts.blockcertsv2;

var CONTEXTS = {};
// Preload contexts
CONTEXTS["https://w3id.org/blockcerts/schema/2.0-alpha/context.json"] = BLOCKCERTS_CONTEXT;
CONTEXTS["https://www.blockcerts.org/schema/2.0-alpha/context.json"] = BLOCKCERTS_CONTEXT;
CONTEXTS["https://w3id.org/openbadges/v2"] = OBI_CONTEXT;
CONTEXTS["https://openbadgespec.org/v2/context.json"] = OBI_CONTEXT;
CONTEXTS["https://w3id.org/blockcerts/v2"] = BLOCKCERTSV2_CONTEXT;
CONTEXTS["https://www.w3id.org/blockcerts/schema/2.0/context.json"] = BLOCKCERTSV2_CONTEXT;
CONTEXTS["https://w3id.org/blockcerts/v1"] = BLOCKCERTSV1_2_CONTEXT;

function ensureNotRevokedBySpentOutput(revokedAddresses, issuerRevocationKey, recipientRevocationKey) {
  if (issuerRevocationKey) {
    var isRevokedByIssuer = -1 != revokedAddresses.findIndex(function (address) {
      return address === issuerRevocationKey;
    });
    if (isRevokedByIssuer) {
      throw new _default.VerifierError("This certificate batch has been revoked by the issuer.");
    }
  }
  if (recipientRevocationKey) {
    var isRevokedByRecipient = -1 != revokedAddresses.findIndex(function (address) {
      return address === recipientRevocationKey;
    });
    if (isRevokedByRecipient) {
      throw new _default.VerifierError("This recipient's certificate has been revoked.");
    }
  }
}

function ensureNotRevokedByList(revokedAssertions, assertionUid) {
  if (!revokedAssertions) {
    // nothing to do
    return;
  }
  var revokedAddresses = revokedAssertions.map(function (output) {
    return output.id;
  });
  var isRevokedByIssuer = -1 != revokedAddresses.findIndex(function (id) {
    return id === assertionUid;
  });
  if (isRevokedByIssuer) {
    throw new _default.VerifierError("This certificate has been revoked by the issuer.");
  }
}

function ensureIssuerSignature(issuerKey, certificateUid, certificateSignature, chain) {
  var bitcoinChain = chain === _default.Blockchain.bitcoin ? _bitcoinjsLib2.default.networks.bitcoin : _bitcoinjsLib2.default.networks.testnet;
  if (!_bitcoinjsLib2.default.message.verify(issuerKey, certificateSignature, certificateUid, bitcoinChain)) {
    throw new _default.VerifierError("Issuer key doesn't match derived address.");
  }
}

function ensureHashesEqual(actual, expected) {
  if (actual !== expected) {
    throw new _default.VerifierError("Computed hash does not match remote hash");
  }
}

function ensureMerkleRootEqual(merkleRoot, remoteHash) {
  if (merkleRoot !== remoteHash) {
    throw new _default.VerifierError("Merkle root does not match remote hash.");
  }
}

function ensureValidIssuingKey(keyMap, txIssuingAddress, txTime) {
  var validKey = false;
  if (txIssuingAddress in keyMap) {
    validKey = true;
    var theKey = keyMap[txIssuingAddress];
    if (theKey.created) {
      validKey &= txTime >= theKey.created;
    }
    if (theKey.revoked) {
      validKey &= txTime <= theKey.revoked;
    }
    if (theKey.expires) {
      validKey &= txTime <= theKey.expires;
    }
  }
  if (!validKey) {
    throw new _default.VerifierError("Transaction occurred at time when issuing address was not considered valid.");
  }
};

function ensureValidReceipt(receipt) {
  var proofHash = receipt.targetHash;
  var merkleRoot = receipt.merkleRoot;
  try {
    var proof = receipt.proof;
    if (!!proof) {
      for (var index in proof) {
        var node = proof[index];
        if (typeof node.left !== "undefined") {
          var appendedBuffer = _toByteArray('' + node.left + proofHash);
          proofHash = (0, _sha2.default)(appendedBuffer);
        } else if (typeof node.right !== "undefined") {
          var appendedBuffer = _toByteArray('' + proofHash + node.right);
          proofHash = (0, _sha2.default)(appendedBuffer);
        } else {
          throw new _default.VerifierError("We should never get here.");
        }
      }
    }
  } catch (e) {
    throw new _default.VerifierError("The receipt is malformed. There was a problem navigating the merkle tree in the receipt.");
  }

  if (proofHash !== merkleRoot) {
    throw new _default.VerifierError("Invalid Merkle Receipt. Proof hash didn't match Merkle root");
  }
};

function computeLocalHashV1_1(certificateString) {
  // When getting the file over HTTP, we've seen an extra newline be appended. This removes that.
  var correctedData = certificateString.slice(0, -1);
  return (0, _sha2.default)(correctedData);
};

function computeLocalHash(document, version) {
  var expandContext = document["@context"];
  var theDocument = document;
  if (version === _default.CertificateVersion.v2_0 && _default.CheckForUnmappedFields) {
    if (expandContext.find(function (x) {
      return x === Object(x) && "@vocab" in x;
    })) {
      expandContext = null;
    } else {
      expandContext.push({ "@vocab": "http://fallback.org/" });
    }
  }
  var nodeDocumentLoader = _jsonld2.default.documentLoaders.node();
  var customLoader = function customLoader(url, callback) {
    if (url in CONTEXTS) {
      return callback(null, {
        contextUrl: null,
        document: CONTEXTS[url],
        documentUrl: url
      });
    }
    return nodeDocumentLoader(url, callback);
  };
  _jsonld2.default.documentLoader = customLoader;
  var normalizeArgs = {
    algorithm: 'URDNA2015',
    format: 'application/nquads'
  };
  if (expandContext) {
    normalizeArgs.expandContext = expandContext;
  }

  return new _promise2.default(function (resolve, reject) {
    _jsonld2.default.normalize(theDocument, normalizeArgs, function (err, normalized) {
      if (!!err) {
        reject(new _default.VerifierError(err, "Failed JSON-LD normalization"));
      } else {
        var unmappedFields = getUnmappedFields(normalized);
        if (unmappedFields) {
          reject(new _default.VerifierError("Found unmapped fields during JSON-LD normalization: " + unmappedFields.join(",")));
        } else {
          resolve((0, _sha2.default)(_toUTF8Data(normalized)));
        }
      }
    });
  });
};

function getUnmappedFields(normalized) {
  var myRegexp = /<http:\/\/fallback\.org\/(.*)>/;
  var matches = myRegexp.exec(normalized);
  if (matches) {
    var unmappedFields = Array();
    for (var i = 0; i < matches.length; i++) {
      unmappedFields.push(matches[i]);
    }
    return unmappedFields;
  }
  return null;
};

function ensureNotExpired(expires) {
  if (!expires) {
    return;
  }
  var expiryDate = Date.parse(expires);
  if (new Date() >= expiryDate) {
    throw new _default.VerifierError("This certificate has expired.");
  }
  // otherwise, it's fine
}

function _toByteArray(hexString) {
  var outArray = [];
  var byteSize = 2;
  for (var i = 0; i < hexString.length; i += byteSize) {
    outArray.push(parseInt(hexString.substring(i, i + byteSize), 16));
  }
  return outArray;
};

function _toUTF8Data(string) {
  var utf8 = [];
  for (var i = 0; i < string.length; i++) {
    var charcode = string.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);else if (charcode < 0x800) {
      utf8.push(0xc0 | charcode >> 6, 0x80 | charcode & 0x3f);
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | charcode >> 12, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
    }
    // surrogate pair
    else {
        i++;
        // UTF-16 encodes 0x10000-0x10FFFF by
        // subtracting 0x10000 and splitting the
        // 20 bits of 0x0-0xFFFFF into two halves
        charcode = 0x10000 + ((charcode & 0x3ff) << 10 | string.charCodeAt(i) & 0x3ff);
        utf8.push(0xf0 | charcode >> 18, 0x80 | charcode >> 12 & 0x3f, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
      }
  }
  return utf8;
};

function _hexFromByteArray(byteArray) {
  var out = "";
  for (var i = 0; i < byteArray.length; ++i) {
    var value = byteArray[i];
    if (value < 16) {
      out += "0" + value.toString(16);
    } else {
      out += value.toString(16);
    }
  }
  return out;
};