import {
  URL,
} from 'url';

function Request(domain, path, method, headers) {
  this.domain = domain;
  this.path = path;
  this.method = method;
  this.headers = headers;
}

Request.prototype = {
  constructor: Request,
  setURL(url) {
    this.url = url;
  },
  setPath(path) {
    this.path = path;
  },
};

function JSONParser(data) {
  let domain = '';
  let path = '';
  let method = '';
  let headers = {};
  const jsonObj = JSON.parse(data);
  if ('url' in jsonObj) {
    const url = new URL(jsonObj.url);
    domain = url.hostname;
    path = url.pathname;
  }
  if ('method' in jsonObj) {
    method = jsonObj.method;
  }
  if ('headers' in jsonObj) {
    headers = jsonObj.headers;
  }
  return new Request(domain, path, method, headers);
}

const request = {
  createRequest: (domain, path, method, headers) => new Request(domain, path, method, headers),
  JSONParser,
};

export default request;