'use strict';

const convertValueFromEnvironment = require('./util');

/**
 * Dto for Request generic object.
 * @param {string} name
 * @param {string} protocol
 * @param {string} domain
 * @param {string} port
 * @param {string} path
 * @param {string} method
 * @param {string} bodyData
 */
function RequestObject(name, protocol, domain, port, path, method, bodyData) {
  this.name = name;
  this.protocol = protocol;
  this.domain = domain;
  this.port = port;
  this.path = path;
  this.method = method;
  this.bodyData = bodyData;
  this.headerCollection = [];
}

RequestObject.prototype.rawUrl = function() {
  return this.protocol + '://' + this.domain + '/' + this.path;
};

RequestObject.prototype.rawPath = function() {
  return '/' + this.path;
};

RequestObject.prototype.method = function() {
  return this.method;
};

RequestObject.prototype.addHeaderCollection = function(key, value) {
  const headerItem = {
    headerName: convertValueFromEnvironment(key),
    headerValue: convertValueFromEnvironment(value),
  };

  this.headerCollection.push(headerItem);
};

RequestObject.prototype.transformToJmeterRequest = function() {
  const view = {
    testName: this.name,
    domain: convertValueFromEnvironment(this.domain),
    port: this.port,
    protocol: this.protocol,
    path: this.rawPath(),
    method: this.method,
    bodyData: this.bodyData,
    httpTestCollectionsHeader: this.headerCollection,
  };

  return view;
};

module.exports = RequestObject;
