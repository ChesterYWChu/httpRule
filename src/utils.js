import EventEmitter from 'events';
import URLPattern from 'url-pattern';


const utils = {
  matchURLPattern(pattern, url) {
    const urlPattern = new URLPattern(pattern);
    if (urlPattern.match(url)) {
      return true;
    }
    return false;
  },
  matchOneOfURLPatterns(patterns, url) {
    for (let i = 0; i < patterns.length; i += 1) {
      if (this.matchURLPattern(patterns[i], url)) {
        return true;
      }
    }
    return false;
  },
  isReadableStream(stream) {
    return stream instanceof EventEmitter && typeof stream.read === 'function';
  },
  isWritableStream(stream) {
    return stream instanceof EventEmitter && typeof stream.write === 'function' && typeof stream.end === 'function';
  },
  isString(input) {
    return typeof input === 'string' || input instanceof String;
  },
  isObject(input) {
    return typeof input === 'object' && input !== null;
  },
  isArray(input) {
    return Object.prototype.toString.call(input) === '[object Array]';
  },
  isFunction(inut) {
    return inut && {}.toString.call(inut) === '[object Function]';
  },
};


export default utils;
