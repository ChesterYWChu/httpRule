import URL from 'url';
import yaml from 'js-yaml';
import cookie from 'cookie';
import utils from './utils';

function InvalidRequestValueError(message) {
  this.message = message;
  this.name = 'InvalidValueError';
  Error.captureStackTrace(this, InvalidRequestValueError);
}
InvalidRequestValueError.prototype = Object.create(Error.prototype);
InvalidRequestValueError.prototype.constructor = InvalidRequestValueError;

function Request(url, method, headers) {
  this.setURL(url);
  this.setMethod(method);
  this.setHeaders(headers);
}

Request.prototype = {
  constructor: Request,
  getURL() {
    return URL.format(this.urlObj);
  },
  setURL(url) {
    this.urlObj = URL.parse(url, false, false);
  },
  getDomain() {
    return this.urlObj.hostname;
  },
  setDomain(domain) {
    this.urlObj.hostname = domain;
  },
  getPath() {
    return this.urlObj.pathname;
  },
  setPath(path) {
    this.urlObj.pathname = path;
  },
  getMethod() {
    return this.method;
  },
  setMethod(method) {
    this.method = method;
  },
  getHeaders() {
    return this.headers;
  },
  setHeaders(headers) {
    if (headers) {
      if (utils.isObject(headers)) {
        this.headers = headers;
      } else {
        throw new InvalidRequestValueError(`invalid headers type: ${typeof headers}, should be object`);
      }
    } else {
      this.headers = {};
    }
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
    if ('referer' in this.headers) {
      const refererURLObj = URL.parse(this.headers.referer);
      if (refererURLObj.hostname === domain) {
        return true;
      }
    }
    return false;
  },
  addHeader(key, value) {
    if (utils.isFunction(value)) {
      // value is a function
      this.headers[key] = value();
    } else { // value is string
      this.headers[key] = value;
    }
  },
  hasHeader(key) {
    if (key in this.headers) {
      return true;
    }
    return false;
  },
  hasHeaderWithValues(key, values) {
    if (key in this.headers) {
      const value = this.headers[key];
      if (values.includes(value)) {
        return true;
      }
    }
    return false;
  },
  removeAllURLQueryString() {
    delete this.urlObj.search;
  },
  addURLQueryString(key, value) {
    const searchParams = new URL.URLSearchParams(this.urlObj.search);
    searchParams.append(key, value);
    this.urlObj.search = searchParams.toString();
  },
  deleteURLQueryString(key) {
    const searchParams = new URL.URLSearchParams(this.urlObj.search);
    searchParams.delete(key);
    this.urlObj.search = searchParams.toString();
  },
  allowDomains(domains) {
    if (domains.includes(this.getDomain())) {
      return true;
    }
    return false;
  },
};

function dataobjToRequestAdapter(obj) {
  let url = '';
  let method = '';
  let headers = {};
  if ('url' in obj && utils.isString(obj.url)) {
    url = obj.url;
  }
  if ('method' in obj && utils.isString(obj.method)) {
    method = obj.method;
  }
  if ('headers' in obj && utils.isObject(obj.headers)) {
    headers = obj.headers;
  }
  return new Request(url, method, headers);
}

function requestToDataobjAdapter(req) {
  return {
    url: req.getURL(),
    method: req.getMethod(),
    headers: req.getHeaders(),
  };
}

function JSONParser(data) {
  const jsonObj = JSON.parse(data);
  return dataobjToRequestAdapter(jsonObj);
}

function JSONDumper(req) {
  const dataobj = requestToDataobjAdapter(req);
  const jsonString = JSON.stringify(dataobj, null, 4);
  return jsonString;
}

function YAMLParser(data) {
  const yamlObj = yaml.safeLoad(data, 'utf8');
  return dataobjToRequestAdapter(yamlObj);
}

function YAMLDumper(req) {
  const dataobj = requestToDataobjAdapter(req);
  const yamlString = yaml.safeDump(dataobj);
  return yamlString;
}


const request = {
  createRequest: (url, method, headers) => new Request(url, method, headers),
  JSONParser,
  JSONDumper,
  YAMLParser,
  YAMLDumper,
};

export default request;
