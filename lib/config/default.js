"use strict";

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _ref;

var _verror = require("verror");

var _verror2 = _interopRequireDefault(_verror);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Status = {
  computingLocalHash: "computingLocalHash",
  fetchingRemoteHash: "fetchingRemoteHash",
  comparingHashes: "comparingHashes",
  checkingMerkleRoot: "checkingMerkleRoot",
  checkingReceipt: "checkingReceipt",
  checkingIssuerSignature: "checkingIssuerSignature",
  checkingAuthenticity: "checkingAuthenticity",
  checkingRevokedStatus: "checkingRevokedStatus",
  checkingExpiresDate: "checkingExpiresDate",
  success: "success",
  failure: "failure",
  mockSuccess: "mockSuccess"
};

var verboseMessageMap = {};
verboseMessageMap[Status.computingLocalHash] = "Computing Local Hash";
verboseMessageMap[Status.comparingHashes] = "Comparing Hashes";
verboseMessageMap[Status.checkingMerkleRoot] = "Checking Merkle Root";
verboseMessageMap[Status.checkingReceipt] = "Checking Receipt";
verboseMessageMap[Status.checkingRevokedStatus] = "Checking Revoked Status";
verboseMessageMap[Status.checkingAuthenticity] = "Checking Authenticity";
verboseMessageMap[Status.checkingExpiresDate] = "Checking Expires Date";
verboseMessageMap[Status.checkingIssuerSignature] = "Checking Issuer Signature";

var getVerboseMessage = function getVerboseMessage(status) {
  return verboseMessageMap[status];
};

var VerifierError = function (_VError) {
  (0, _inherits3.default)(VerifierError, _VError);

  function VerifierError(message) {
    (0, _classCallCheck3.default)(this, VerifierError);
    return (0, _possibleConstructorReturn3.default)(this, (VerifierError.__proto__ || (0, _getPrototypeOf2.default)(VerifierError)).call(this, message));
  }

  return VerifierError;
}(_verror2.default);

module.exports = {
  CertificateVersion: {
    v1_1: "1.1",
    v1_2: "1.2",
    v2_0: "2.0"
  },

  Blockchain: {
    bitcoin: "bitcoin",
    testnet: "testnet",
    regtest: "regtest",
    mocknet: "mocknet",
    ethmain: "ethmain",
    ethropst: "ethropst",
    ethtest: "ethtest"
  },

  ChainSignatureValue: {
    /*
    These are the external display of `chain` in the signature suite. Adding a new type since `Blockchain` is
    used by the web component and so we need to remain compatible.
    */
    bitcoin: "bitcoinMainnet",
    testnet: "bitcoinTestnet",
    regtest: "bitcoinRegtest",
    ethmain: "ethereumMainnet",
    ethropst: "ethereumRopsten",
    ethtest: "ethereumTestnet",
    mocknet: "mockchain"
  },

  VerifierError: VerifierError,

  SecurityContextUrl: "https://w3id.org/security/v1",

  Url: {
    blockCypherUrl: "https://api.blockcypher.com/v1/btc/main/txs/",
    blockCypherTestUrl: "https://api.blockcypher.com/v1/btc/test3/txs/",
    chainSoUrl: "https://chain.so/api/v2/get_tx/BTC/",
    chainSoTestUrl: "https://chain.so/api/v2/get_tx/BTCTEST/"
  },

  Status: Status,
  getVerboseMessage: getVerboseMessage,
  // Minimum number of confirmations to consider a transaction valid. Recommended setting = 10
  MininumConfirmations: 1,
  // Minimum number of blockchain APIs to consult to compare transaction data consistency
  MinimumBlockchainExplorers: 1,
  // Try all blockchain explorers (even > MinimumBlockchainExplorers) to increase the chance of a successful query.
  Race: false,

  CheckForUnmappedFields: true,

  PublicKey: "ecdsa-koblitz-pubkey:1",

  //TODO Fixes or read direct in files??
  Contexts: {
    obi: {
      "@context": {
        "id": "@id",
        "type": "@type",

        "extensions": "https://w3id.org/openbadges/extensions#",
        "obi": "https://w3id.org/openbadges#",
        "validation": "obi:validation",

        "cred": "https://w3id.org/credentials#",
        "dc": "http://purl.org/dc/terms/",
        "schema": "http://schema.org/",
        "sec": "https://w3id.org/security#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",

        "AlignmentObject": "schema:AlignmentObject",
        "CryptographicKey": "sec:Key",
        "Endorsement": "cred:Credential",

        "Assertion": "obi:Assertion",
        "BadgeClass": "obi:BadgeClass",
        "Criteria": "obi:Criteria",
        "Evidence": "obi:Evidence",
        "Extension": "obi:Extension",
        "FrameValidation": "obi:FrameValidation",
        "IdentityObject": "obi:IdentityObject",
        "Image": "obi:Image",
        "HostedBadge": "obi:HostedBadge",
        "hosted": "obi:HostedBadge",
        "Issuer": "obi:Issuer",
        "Profile": "obi:Profile",
        "RevocationList": "obi:RevocationList",
        "SignedBadge": "obi:SignedBadge",
        "signed": "obi:SignedBadge",
        "TypeValidation": "obi:TypeValidation",
        "VerificationObject": "obi:VerificationObject",

        "author": { "@id": "schema:author", "@type": "@id" },
        "caption": { "@id": "schema:caption" },
        "claim": { "@id": "cred:claim", "@type": "@id" },
        "created": { "@id": "dc:created", "@type": "xsd:dateTime" },
        "creator": { "@id": "dc:creator", "@type": "@id" },
        "description": { "@id": "schema:description" },
        "email": { "@id": "schema:email" },
        "endorsement": { "@id": "cred:credential", "@type": "@id" },
        "expires": { "@id": "sec:expiration", "@type": "xsd:dateTime" },
        "genre": { "@id": "schema:genre" },
        "image": { "@id": "schema:image", "@type": "@id" },
        "name": { "@id": "schema:name" },
        "owner": { "@id": "sec:owner", "@type": "@id" },
        "publicKey": { "@id": "sec:publicKey", "@type": "@id" },
        "publicKeyPem": { "@id": "sec:publicKeyPem" },
        "related": { "@id": "dc:relation", "@type": "@id" },
        "startsWith": { "@id": "http://purl.org/dqm-vocabulary/v1/dqm#startsWith" },
        "tags": { "@id": "schema:keywords" },
        "targetDescription": { "@id": "schema:targetDescription" },
        "targetFramework": { "@id": "schema:targetFramework" },
        "targetName": { "@id": "schema:targetName" },
        "targetUrl": { "@id": "schema:targetUrl" },
        "telephone": { "@id": "schema:telephone" },
        "url": { "@id": "schema:url", "@type": "@id" },
        "version": { "@id": "schema:version" },

        "alignment": { "@id": "obi:alignment", "@type": "@id" },
        "allowedOrigins": { "@id": "obi:allowedOrigins" },
        "audience": { "@id": "obi:audience" },
        "badge": { "@id": "obi:badge", "@type": "@id" },
        "criteria": { "@id": "obi:criteria", "@type": "@id" },
        "endorsementComment": { "@id": "obi:endorsementComment" },
        "evidence": { "@id": "obi:evidence", "@type": "@id" },
        "hashed": { "@id": "obi:hashed", "@type": "xsd:boolean" },
        "identity": { "@id": "obi:identityHash" },
        "issuedOn": { "@id": "obi:issueDate", "@type": "xsd:dateTime" },
        "issuer": { "@id": "obi:issuer", "@type": "@id" },
        "narrative": { "@id": "obi:narrative" },
        "recipient": { "@id": "obi:recipient", "@type": "@id" },
        "revocationList": { "@id": "obi:revocationList", "@type": "@id" },
        "revocationReason": { "@id": "obi:revocationReason" },
        "revoked": { "@id": "obi:revoked", "@type": "xsd:boolean" },
        "revokedAssertions": { "@id": "obi:revoked" },
        "salt": { "@id": "obi:salt" },
        "targetCode": { "@id": "obi:targetCode" },
        "uid": { "@id": "obi:uid" },
        "validatesType": "obi:validatesType",
        "validationFrame": "obi:validationFrame",
        "validationSchema": "obi:validationSchema",
        "verification": { "@id": "obi:verify", "@type": "@id" },
        "verificationProperty": { "@id": "obi:verificationProperty" },
        "verify": "verification"
      }
    },

    blockcerts: {
      "@context": {
        "id": "@id",
        "type": "@type",
        "bc": "https://w3id.org/blockcerts#",
        "obi": "https://w3id.org/openbadges#",
        "cp": "https://w3id.org/chainpoint#",
        "schema": "http://schema.org/",
        "sec": "https://w3id.org/security#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",

        "MerkleProof2017": "sec:MerkleProof2017",

        "RecipientProfile": "bc:RecipientProfile",
        "SignatureLine": "bc:SignatureLine",
        "MerkleProofVerification2017": "bc:MerkleProofVerification2017",

        "recipientProfile": "bc:recipientProfile",
        "signatureLines": "bc:signatureLines",
        "introductionUrl": { "@id": "bc:introductionUrl", "@type": "@id" },

        "subtitle": "bc:subtitle",

        "jobTitle": "schema:jobTitle",

        "creator": { "@id": "dc:creator", "@type": "@id" },
        "expires": {
          "@id": "sec:expiration",
          "@type": "xsd:dateTime"
        },
        "revoked": {
          "@id": "sec:expiration",
          "@type": "xsd:dateTime"
        },
        "CryptographicKey": "sec:Key",
        "signature": "sec:signature",

        "verification": "bc:verification",
        "publicKeys": "bc:publicKeys",

        "ChainpointSHA256v2": "cp:ChainpointSHA256v2",
        "BTCOpReturn": "cp:BTCOpReturn",
        "targetHash": "cp:targetHash",
        "merkleRoot": "cp:merkleRoot",
        "proof": "cp:proof",
        "anchors": "cp:anchors",
        "sourceId": "cp:sourceId",
        "right": "cp:right",
        "left": "cp:left"
      },
      "obi:validation": [{
        "obi:validatesType": "RecipientProfile",
        "obi:validationSchema": "https://w3id.org/blockcerts/schema/2.0-alpha/recipientSchema.json"
      }, {
        "obi:validatesType": "SignatureLine",
        "obi:validationSchema": "https://w3id.org/blockcerts/schema/2.0-alpha/signatureLineSchema.json"
      }, {
        "obi:validatesType": "MerkleProof2017",
        "obi:validationSchema": "https://w3id.org/blockcerts/schema/2.0-alpha/merkleProof2017Schema.json"
      }]
    },

    blockcertsv1_2: {
      "@context": [(_ref = {
        "id": "@id",
        "type": "@type",
        "bc": "https://w3id.org/blockcerts#",
        "obi": "https://w3id.org/openbadges#",
        "cp": "https://w3id.org/chainpoint#",
        "extensions": "https://w3id.org/openbadges/extensions#",
        "validation": "obi:validation",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "schema": "http://schema.org/",
        "sec": "https://w3id.org/security#",
        "Assertion": "bc:Assertion",
        "Certificate": "bc:Certificate",
        "Issuer": "bc:Issuer",
        "BlockchainCertificate": "bc:BlockchainCertificate",
        "CertificateDocument": "bc:CertificateDocument",
        "issuer": {
          "@id": "bc:issuer",
          "@type": "@id"
        },
        "recipient": {
          "@id": "bc:recipient",
          "@type": "@id"
        },
        "blockchaincertificate": {
          "@id": "bc:blockchaincertificate",
          "@type": "@id"
        },
        "certificate": {
          "@id": "bc:certificate",
          "@type": "@id"
        },
        "document": {
          "@id": "bc:document",
          "@type": "@id"
        },
        "assertion": {
          "@id": "bc:assertion",
          "@type": "@id"
        },
        "verify": {
          "@id": "bc:verify",
          "@type": "@id"
        }
      }, (0, _defineProperty3.default)(_ref, "recipient", {
        "@id": "bc:recipient",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "receipt", {
        "@id": "bc:receipt",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "publicKey", {
        "@id": "bc:publicKey"
      }), (0, _defineProperty3.default)(_ref, "revocationKey", {
        "@id": "bc:revocationKey"
      }), (0, _defineProperty3.default)(_ref, "image:signature", {
        "@id": "bc:image:signature"
      }), (0, _defineProperty3.default)(_ref, "signature", {
        "@id": "bc:signature"
      }), (0, _defineProperty3.default)(_ref, "familyName", {
        "@id": "schema:familyName"
      }), (0, _defineProperty3.default)(_ref, "givenName", {
        "@id": "schema:givenName"
      }), (0, _defineProperty3.default)(_ref, "jobTitle", {
        "@id": "schema:jobTitle"
      }), (0, _defineProperty3.default)(_ref, "signer", {
        "@id": "bc:signer",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "attribute-signed", {
        "@id": "bc:attribute-signed"
      }), (0, _defineProperty3.default)(_ref, "ECDSA(secp256k1)", "bc:SignedBadge"), (0, _defineProperty3.default)(_ref, "subtitle", {
        "@id": "bc:subtitle"
      }), (0, _defineProperty3.default)(_ref, "email", "schema:email"), (0, _defineProperty3.default)(_ref, "hashed", {
        "@id": "obi:hashed",
        "@type": "xsd:boolean"
      }), (0, _defineProperty3.default)(_ref, "image", {
        "@id": "schema:image",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "salt", {
        "@id": "obi:salt"
      }), (0, _defineProperty3.default)(_ref, "identity", {
        "@id": "obi:identityHash"
      }), (0, _defineProperty3.default)(_ref, "issuedOn", {
        "@id": "obi:issueDate",
        "@type": "xsd:dateTime"
      }), (0, _defineProperty3.default)(_ref, "expires", {
        "@id": "sec:expiration",
        "@type": "xsd:dateTime"
      }), (0, _defineProperty3.default)(_ref, "evidence", {
        "@id": "obi:evidence",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "criteria", {
        "@id": "obi:criteria",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "tags", {
        "@id": "schema:keywords"
      }), (0, _defineProperty3.default)(_ref, "alignment", {
        "@id": "obi:alignment",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "revocationList", {
        "@id": "obi:revocationList",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "name", {
        "@id": "schema:name"
      }), (0, _defineProperty3.default)(_ref, "description", {
        "@id": "schema:description"
      }), (0, _defineProperty3.default)(_ref, "url", {
        "@id": "schema:url",
        "@type": "@id"
      }), (0, _defineProperty3.default)(_ref, "uid", {
        "@id": "obi:uid"
      }), (0, _defineProperty3.default)(_ref, "revocationList", "obi:revocationList"), (0, _defineProperty3.default)(_ref, "TypeValidation", "obi:TypeValidation"), (0, _defineProperty3.default)(_ref, "FrameValidation", "obi:FrameValidation"), (0, _defineProperty3.default)(_ref, "validatesType", "obi:validatesType"), (0, _defineProperty3.default)(_ref, "validationSchema", "obi:validationSchema"), (0, _defineProperty3.default)(_ref, "validationFrame", "obi:validationFrame"), (0, _defineProperty3.default)(_ref, "ChainpointSHA224v2", "cp:ChainpointSHA224v2"), (0, _defineProperty3.default)(_ref, "ChainpointSHA256v2", "cp:ChainpointSHA256v2"), (0, _defineProperty3.default)(_ref, "ChainpointSHA384v2", "cp:ChainpointSHA384v2"), (0, _defineProperty3.default)(_ref, "ChainpointSHA512v2", "cp:ChainpointSHA512v2"), (0, _defineProperty3.default)(_ref, "ChainpointSHA3-224v2", "cp:ChainpointSHA3-224v2"), (0, _defineProperty3.default)(_ref, "ChainpointSHA3-256v2", "cp:ChainpointSHA3-256v2"), (0, _defineProperty3.default)(_ref, "ChainpointSHA3-384v2", "cp:ChainpointSHA3-384v2"), (0, _defineProperty3.default)(_ref, "ChainpointSHA3-512v2", "cp:ChainpointSHA3-512v2"), (0, _defineProperty3.default)(_ref, "BTCOpReturn", "cp:BTCOpReturn"), (0, _defineProperty3.default)(_ref, "targetHash", "cp:targetHash"), (0, _defineProperty3.default)(_ref, "merkleRoot", "cp:merkleRoot"), (0, _defineProperty3.default)(_ref, "proof", "cp:proof"), (0, _defineProperty3.default)(_ref, "anchors", "cp:anchors"), (0, _defineProperty3.default)(_ref, "sourceId", "cp:sourceId"), (0, _defineProperty3.default)(_ref, "right", "cp:right"), (0, _defineProperty3.default)(_ref, "left", "cp:left"), _ref)],
      "validation": [{
        "type": "TypeValidation",
        "validatesType": "Assertion",
        "validationSchema": "https://w3id.org/blockcerts/schema/1.2/assertion-1.2.json"
      }, {
        "type": "TypeValidation",
        "validatesType": "Certificate",
        "validationSchema": "https://w3id.org/blockcerts/schema/1.2/certificate-1.2.json"
      }, {
        "type": "TypeValidation",
        "validatesType": "Issuer",
        "validationSchema": "https://w3id.org/blockcerts/schema/1.2/issuer-1.2.json"
      }, {
        "type": "TypeValidation",
        "validatesType": "CertificateDocument",
        "validationSchema": "https://w3id.org/blockcerts/schema/1.2/certificate-document-1.2.json"
      }, {
        "type": "TypeValidation",
        "validatesType": "BlockchainCertificate",
        "validationSchema": "https://w3id.org/blockcerts/schema/1.2/blockchain-certificate-1.2.json"
      }, {
        "type": "TypeValidation",
        "validatesType": "BlockchainReceipt",
        "validationSchema": "https://w3id.org/blockcerts/schema/1.2/blockchain-receipt-1.2.json"
      }]
    },

    blockcertsv2: {
      "@context": {
        "id": "@id",
        "type": "@type",
        "bc": "https://w3id.org/blockcerts#",
        "obi": "https://w3id.org/openbadges#",
        "cp": "https://w3id.org/chainpoint#",
        "schema": "http://schema.org/",
        "sec": "https://w3id.org/security#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",

        "MerkleProof2017": "sec:MerkleProof2017",

        "RecipientProfile": "bc:RecipientProfile",
        "SignatureLine": "bc:SignatureLine",
        "MerkleProofVerification2017": "bc:MerkleProofVerification2017",

        "recipientProfile": "bc:recipientProfile",
        "signatureLines": "bc:signatureLines",
        "introductionUrl": { "@id": "bc:introductionUrl", "@type": "@id" },

        "subtitle": "bc:subtitle",

        "jobTitle": "schema:jobTitle",

        "expires": {
          "@id": "sec:expiration",
          "@type": "xsd:dateTime"
        },
        "revoked": {
          "@id": "obi:revoked",
          "@type": "xsd:boolean"
        },
        "CryptographicKey": "sec:Key",
        "signature": "sec:signature",
        "verification": {
          "@id": "obi:verify",
          "@type": "@id"
        },
        "publicKey": {
          "@id": "sec:publicKey",
          "@type": "@id"
        },

        "ChainpointSHA256v2": "cp:ChainpointSHA256v2",
        "BTCOpReturn": "cp:BTCOpReturn",
        "targetHash": "cp:targetHash",
        "merkleRoot": "cp:merkleRoot",
        "proof": "cp:proof",
        "anchors": "cp:anchors",
        "sourceId": "cp:sourceId",
        "right": "cp:right",
        "left": "cp:left"
      },
      "obi:validation": [{
        "obi:validatesType": "RecipientProfile",
        "obi:validationSchema": "https://w3id.org/blockcerts/schema/2.0/recipientSchema.json"
      }, {
        "obi:validatesType": "SignatureLine",
        "obi:validationSchema": "https://w3id.org/blockcerts/schema/2.0/signatureLineSchema.json"
      }, {
        "obi:validatesType": "MerkleProof2017",
        "obi:validationSchema": "https://w3id.org/blockcerts/schema/2.0/merkleProof2017Schema.json"
      }]
    }
  }

};