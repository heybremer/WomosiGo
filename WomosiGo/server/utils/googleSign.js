const crypto = require('crypto');
const { URL } = require('url');

function base64UrlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, 'base64');
}

function bufferToBase64Url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signPathAndQuery(pathAndQuery, secretBase64Url) {
  const key = base64UrlToBuffer(secretBase64Url);
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(pathAndQuery);
  const signature = hmac.digest();
  return bufferToBase64Url(signature);
}

// Given a full Google API URL and secret, append X-Goog-Signature parameter
function appendSignatureParam(googleUrl, secretBase64Url) {
  const url = new URL(googleUrl);
  const pathAndQuery = url.pathname + (url.search || '');
  const sig = signPathAndQuery(pathAndQuery, secretBase64Url);
  url.searchParams.set('X-Goog-Signature', sig);
  return url.toString();
}

module.exports = {
  appendSignatureParam,
  signPathAndQuery,
};


