import {
  URL,
} from 'url';
import yaml from 'js-yaml';
import cookie from 'cookie';

function Request(domain, path, method, headers) {
  this.domain = domain;
  this.path = path;
  this.method = method;
  this.headers = headers;
}

Request.prototype = {
  constructor: Request,
  getDomain() {
    return this.domain;
  },
  setDomain(domain) {
    this.domain = domain;
  },
  getPath() {
    return this.path;
  },
  setPath(path) {
    this.path = path;
  },
  getMethod() {
    return this.method;
  },
  setMethod(method) {
    this.method = method;
  },
  hasCookie(key) {
    if (this.headers && 'Cookie' in this.headers) {
      const cookies = cookie.parse(this.headers.Cookie);
      if (key in cookies) {
        return true;
      }
    }
    return false;
  },
  refererBelongsTo(domain) {
    if (this.headers && 'referer' in this.headers) {
      const refererURL = new URL(this.headers.referer);
      if (refererURL.hostname === domain) {
        return true;
      }
    }
    return false;
  },
};

function objToRequestAdapter(obj) {
  let domain = '';
  let path = '';
  let method = '';
  let headers = {};
  if ('url' in obj) {
    const url = new URL(obj.url);
    domain = url.hostname;
    path = url.pathname;
  }
  if ('method' in obj) {
    method = obj.method;
  }
  if ('headers' in obj) {
    headers = obj.headers;
  }
  return new Request(domain, path, method, headers);
}

function JSONParser(data) {
  const jsonObj = JSON.parse(data);
  return objToRequestAdapter(jsonObj);
}

function YAMLParser(data) {
  const yamlObj = yaml.safeLoad(data, 'utf8');
  return objToRequestAdapter(yamlObj);
}


const request = {
  createRequest: (domain, path, method, headers) => new Request(domain, path, method, headers),
  JSONParser,
  YAMLParser,
};

export default request;
