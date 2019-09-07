import {
  URL,
} from 'url';
import yaml from 'js-yaml';

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
