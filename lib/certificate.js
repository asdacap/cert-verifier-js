'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SignatureImage = exports.Certificate = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _default = require('./config/default');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('string.prototype.startswith');

var isBitcoinMainnetAddress = function isBitcoinMainnetAddress(bitcoinAddress) {
  if (bitcoinAddress.startsWith("1") || bitcoinAddress.startsWith(_default.PublicKey)) {
    return true;
  }
  return false;
};

var getChain = function getChain(signature, bitcoinAddress) {
  var anchor = signature.anchors[0];
  if (anchor.chain) {
    var chain = anchor.chain;
    if (chain == _default.ChainSignatureValue.bitcoin) {
      return _default.Blockchain.bitcoin;
    } else if (chain == _default.ChainSignatureValue.testnet) {
      return _default.Blockchain.testnet;
    } else if (chain == _default.ChainSignatureValue.regtest) {
      return _default.Blockchain.regtest;
    } else if (chain == _default.ChainSignatureValue.mocknet) {
      return _default.Blockchain.mocknet;
    } else {
      throw new VError("Didn't recognize chain value");
    }
  }
  // Legacy path: we didn't support anything other than testnet and mainnet, so we check the address prefix
  // otherwise try to determine the chain from a bitcoin address
  if (isBitcoinMainnetAddress(bitcoinAddress)) {
    return _default.Blockchain.bitcoin;
  }
  return _default.Blockchain.testnet;
};

var getNameForChain = function getNameForChain(chain) {
  return chain.toString();
};

var Certificate = exports.Certificate = function () {
  function Certificate(version, name, title, subtitle, description, certificateImage, signatureImage, sealImage, id, issuer, receipt, signature, publicKey, revocationKey, chain, expires) {
    _classCallCheck(this, Certificate);

    this.version = version;
    this.name = name;
    this.title = title;
    this.subtitle = subtitle;
    this.description = description;
    this.certificateImage = certificateImage;
    this.signatureImage = signatureImage;
    this.sealImage = sealImage;
    this.id = id;
    this.issuer = issuer;
    this.receipt = receipt;
    this.signature = signature;
    this.publicKey = publicKey;
    this.revocationKey = revocationKey;
    this.chain = chain;
    this.chainAsString = getNameForChain(chain);
    this.expires = expires;
  }

  _createClass(Certificate, null, [{
    key: 'parseV1',
    value: function parseV1(certificateJson) {
      var certificate = certificateJson.certificate || certificateJson.document.certificate;
      var recipient = certificateJson.recipient || certificateJson.document.recipient;
      var assertion = certificateJson.document.assertion;
      var certificateImage = certificate.image;
      var name = recipient.givenName + ' ' + recipient.familyName;
      var title = certificate.title || certificate.name;
      var description = certificate.description;
      var signatureImage = certificateJson.document && certificateJson.document.assertion && certificateJson.document.assertion["image:signature"];
      var expires = assertion.expires;

      var signatureImageObjects = [];
      if (signatureImage.constructor === Array) {
        for (var index in signatureImage) {
          var signatureLine = signatureImage[index];
          var jobTitle = 'jobTitle' in signatureLine ? signatureLine.jobTitle : null;
          var signerName = 'name' in signatureLine ? signatureLine.name : null;
          var signatureObject = new SignatureImage(signatureLine.image, jobTitle, signerName);
          signatureImageObjects.push(signatureObject);
        }
      } else {
        var signatureObject = new SignatureImage(signatureImage, null, null);
        signatureImageObjects.push(signatureObject);
      }

      var sealImage = certificate.issuer.image;
      var subtitle = certificate.subtitle;
      if ((typeof subtitle === 'undefined' ? 'undefined' : _typeof(subtitle)) == "object") {
        subtitle = subtitle.display ? subtitle.content : "";
      }
      var id = assertion.uid;
      var issuer = certificate.issuer;
      var receipt = certificateJson.receipt;
      var signature = certificateJson.document.signature;
      var publicKey = recipient.publicKey;
      var revocationKey = recipient.revocationKey || null;

      var version = void 0;
      if (typeof receipt === "undefined") {
        version = _default.CertificateVersion.v1_1;
      } else {
        version = _default.CertificateVersion.v1_2;
      }

      var chain;
      if (isBitcoinMainnetAddress(publicKey)) {
        chain = _default.Blockchain.bitcoin;
      } else {
        chain = _default.Blockchain.testnet;
      }

      return new Certificate(version, name, title, subtitle, description, certificateImage, signatureImageObjects, sealImage, id, issuer, receipt, signature, publicKey, revocationKey, chain, expires);
    }
  }, {
    key: 'parseV2',
    value: function parseV2(certificateJson) {
      var id = certificateJson.id,
          recipient = certificateJson.recipient,
          expires = certificateJson.expires,
          receipt = certificateJson.signature,
          badge = certificateJson.badge;
      var certificateImage = badge.image,
          title = badge.name,
          description = badge.description,
          subtitle = badge.subtitle,
          issuer = badge.issuer;

      var issuerKey = certificateJson.verification.publicKey || certificateJson.verification.creator;
      var recipientProfile = certificateJson.recipientProfile || certificateJson.recipient.recipientProfile;
      var sealImage = issuer.image;
      var publicKey = recipientProfile.publicKey;
      var name = recipientProfile.name;

      var signatureImageObjects = [];
      for (var index in badge.signatureLines) {
        var signatureLine = badge.signatureLines[index];
        var signatureObject = new SignatureImage(signatureLine.image, signatureLine.jobTitle, signatureLine.name);
        signatureImageObjects.push(signatureObject);
      }

      var chain = getChain(certificateJson.signature, issuerKey);
      return new Certificate(_default.CertificateVersion.v2_0, name, title, subtitle, description, certificateImage, signatureImageObjects, sealImage, id, issuer, receipt, null, publicKey, null, chain, expires);
    }
  }, {
    key: 'parseJson',
    value: function parseJson(certificateJson) {
      var version = certificateJson["@context"];
      if (version instanceof Array) {
        return this.parseV2(certificateJson);
      } else {
        return this.parseV1(certificateJson);
      }
    }
  }]);

  return Certificate;
}();

var SignatureImage = exports.SignatureImage = function SignatureImage(image, jobTitle, name) {
  _classCallCheck(this, SignatureImage);

  this.image = image;
  this.jobTitle = jobTitle;
  this.name = name;
};