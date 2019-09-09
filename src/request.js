import URL from 'url';
import yaml from 'js-yaml';
import cookie from 'cookie';
import utils from './utils';

// invalid request input error
function InvalidRequestValueError(message) {
  this.message = message;
  this.name = 'InvalidValueError';
  Error.captureStackTrace(this, InvalidRequestValueError);
}
InvalidRequestValueError.prototype = Object.create(Error.prototype);
InvalidRequestValueError.prototype.constructor = InvalidRequestValueError;

// Request constructor
function Request(url, method, headers) {
  this.setURL(url);
  this.setMethod(method);
  this.setHeaders(headers);
}

Request.prototype = {
  constructor: Request,
  // url getter
  getURL() {
    return URL.format(this.urlObj);
  },
  // url setter
  setURL(url) {
    this.urlObj = URL.parse(url, false, false);
  },
  // domain getter
  getDomain() {
    return this.urlObj.hostname;
  },
  // domain setter
  setDomain(domain) {
    this.urlObj.hostname = domain;
  },
  // path getter
  getPath() {
    return this.urlObj.pathname;
  },
  // path setter
  setPath(path) {
    this.urlObj.pathname = path;
  },
  // method getter
  getMethod() {
    return this.method;
  },
  // method setter
  setMethod(method) {
    this.method = method;
  },
  // headers getter
  getHeaders() {
    return this.headers;
  },
  // headers setter
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
  // action: check if target key exist in header cookie
  hasCookie(key) {
    if (this.headers && 'Cookie' in this.headers) {
      const cookies = cookie.parse(this.headers.Cookie);
      if (key in cookies) {
        return true;
      }
    }
    return false;
  },
  // action: check if the target cookie value equals to one of the values
  hasCookieWithValues(key, values) {
    if (this.headers && 'Cookie' in this.headers) {
      const cookies = cookie.parse(this.headers.Cookie);
      if (key in cookies) {
        if (values.includes(cookies[key])) {
          return true;
        }
      }
    }
    return false;
  },
  // action: check if referer is belongs to target domain
  refererBelongsTo(domain) {
    if ('referer' in this.headers) {
      const refererURLObj = URL.parse(this.headers.referer);
      if (refererURLObj.hostname === domain) {
        return true;
      }
    }
    return false;
  },
  // action: add a header with key and value
  // key:string, value:string or a callback function that returns a string
  addHeader(key, value) {
    if (utils.isFunction(value)) {
      // value is a function
      this.headers[key] = value();
    } else { // value is string
      this.headers[key] = value;
    }
  },
  // action: check if target key exist in headers
  hasHeader(key) {
    if (key in this.headers) {
      return true;
    }
    return false;
  },
  // action: check if the target header value equals to one of the values
  hasHeaderWithValues(key, values) {
    if (key in this.headers) {
      const value = this.headers[key];
      if (values.includes(value)) {
        return true;
      }
    }
    return false;
  },
  // action: remove all query strings in url
  removeAllURLQueryString() {
    delete this.urlObj.search;
  },
  // action: add an url query string
  addURLQueryString(key, value) {
    const searchParams = new URL.URLSearchParams(this.urlObj.search);
    searchParams.append(key, value);
    this.urlObj.search = searchParams.toString();
  },
  // action: delete an url query string
  deleteURLQueryString(key) {
    const searchParams = new URL.URLSearchParams(this.urlObj.search);
    searchParams.delete(key);
    this.urlObj.search = searchParams.toString();
  },
  // action: check if the domain is in allowed domains
  allowDomains(domains) {
    if (domains.includes(this.getDomain())) {
      return true;
    }
    return false;
  },
};

// convert data object to request object
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

// convert request object to data object
function requestToDataobjAdapter(req) {
  return {
    url: req.getURL(),
    method: req.getMethod(),
    headers: req.getHeaders(),
  };
}

// parse json string into request object
function JSONParser(data) {
  const jsonObj = JSON.parse(data);
  return dataobjToRequestAdapter(jsonObj);
}

// dump request object into json string
function JSONDumper(req) {
  const dataobj = requestToDataobjAdapter(req);
  const jsonString = JSON.stringify(dataobj, null, 4);
  return jsonString;
}

// parse yaml string into request object
function YAMLParser(data) {
  const yamlObj = yaml.safeLoad(data, 'utf8');
  return dataobjToRequestAdapter(yamlObj);
}

// dump request object into yaml string
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
