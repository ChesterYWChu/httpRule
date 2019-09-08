import fs from 'fs';
import EventEmitter from 'events';
import request from './request';

const OPTIONS = {
  KEY_NAME: 'name',
  KEY_FORMAT: 'format',
  FORMAT: {
    JSON: 'json',
    YAML: 'yaml',
  },
  KEY_IO: 'io',
  IO: {
    FILE: 'file',
    STREAM: 'stream',
  },
};

const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

function InvalidValueError(message) {
  this.message = message;
  this.name = 'InvalidValueError';
  Error.captureStackTrace(this, InvalidValueError);
}
InvalidValueError.prototype = Object.create(Error.prototype);
InvalidValueError.prototype.constructor = InvalidValueError;

InvalidValueError.prepend = (message, error) => {
  if (error instanceof InvalidValueError) {
    return new InvalidValueError(`${message}: ${error.message}`);
  }
  return error;
};

function RuleViolationError(message) {
  this.message = message;
  this.name = 'RuleViolationError';
  Error.captureStackTrace(this, RuleViolationError);
}
RuleViolationError.prototype = Object.create(Error.prototype);
RuleViolationError.prototype.constructor = RuleViolationError;

function isReadableStream(stream) {
  return stream instanceof EventEmitter && typeof stream.read === 'function';
}

// function isWritableStream(stream) {
//   return stream instanceof EventEmitter && typeof stream.write === 'function' &&
// typeof stream.end === 'function';
// }

function isString(input) {
  if (typeof input === 'string' || input instanceof String) {
    return true;
  }
  return false;
}

function HTTPTransformer(opt) {
  this.format = OPTIONS.FORMAT.JSON;
  this.io = OPTIONS.IO.FILE;
  if (typeof opt === 'object') {
    if (OPTIONS.KEY_NAME in opt) {
      this.name = opt[OPTIONS.KEY_NAME];
    }
    if (OPTIONS.KEY_FORMAT in opt) {
      if (!Object.values(OPTIONS.FORMAT).includes(opt[OPTIONS.KEY_FORMAT])) {
        throw new InvalidValueError(`unsurported format: ${opt[OPTIONS.KEY_FORMAT]}, should be "json"|"yaml"`);
      }
      this.format = opt[OPTIONS.KEY_FORMAT];
    }
    if (OPTIONS.KEY_IO in opt) {
      if (!Object.values(OPTIONS.IO).includes(opt[OPTIONS.KEY_IO])) {
        throw new InvalidValueError(`unsurported IO type: ${this.io}, should be "file"|"stream"`);
      }
      this.io = opt[OPTIONS.KEY_IO];
    }
  }
  this.parser = this.loadParser(this.format);
  this.rules = [];
}

HTTPTransformer.prototype = {
  constructor: HTTPTransformer,
  sayHello() {
    return `Hello ${this.name}`;
  },

  addRule(rule) {
    this.rules.push(rule);
  },
  transform(input) {
    let req = {};
    req = this.parseInput(input);
    this.tranformRequest(req);
  },
  parseInput(input) {
    const data = this.readData(input);
    return this.parser(data);
  },
  readData(input) {
    if (this.io === OPTIONS.IO.FILE) {
      if (!isString(input)) {
        throw new InvalidValueError(`invalid input type: ${typeof input}, should be string`);
      }
      try {
        const data = fs.readFileSync(input, 'utf8');
        return data;
      } catch (err) {
        throw InvalidValueError.prepend(`failed to read file: ${input}`, err);
      }
    }
    if (this.io === OPTIONS.IO.STREAM) {
      if (!isReadableStream(input)) {
        throw new InvalidValueError(`input stream: ${input} is not a Readable Stream`);
      }

      let data = '';
      input.on('data', (chunk) => {
        data += chunk.toString();
      });
      return input.on('end', () => data);
    }
    throw new InvalidValueError(`unsurported IO type: ${this.io}, should be "file"|"stream"`);
  },
  loadParser(format) {
    let parser;
    switch (format) {
      case OPTIONS.FORMAT.JSON:
        parser = request.JSONParser;
        break;
      case OPTIONS.FORMAT.YAML:
        parser = request.YAMLParser;
        break;
      default:
        throw new InvalidValueError(`unsurported format: ${format}, should be "json"|"yaml"`);
    }
    return parser;
  },
  tranformRequest(req) {
    this.rules.forEach((rule) => {
      if (this.matchCondition(req, rule)) {
        this.doActions(req, rule);
      }
    });
  },
  matchCondition(req, rule) {
    if ('conditions' in rule) {
      const keys = Object.keys(rule.conditions);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const condition = rule.conditions[key];
        switch (key) {
          case 'domain':
            if (!condition.includes(req.getDomain())) {
              return false;
            }
            break;
          case 'path':
            if (!condition.includes(req.getPath())) {
              return false;
            }
            break;
          case 'method':
            if (!condition.includes(req.getMethod())) {
              return false;
            }
            break;
          default:
            throw new InvalidValueError(`unsurported condition: ${key}, should be "domain"|"path"|"method"`);
        }
      }
    }
    return true;
  },
  doActions(req, rule) {
    if ('actions' in rule) {
      rule.actions.forEach((action) => {
        action(req);
      });
    }
  },
};

const httprule = {
  createTranformer: (opt) => new HTTPTransformer(opt),
  updatePath(path) {
    if (!isString(path)) {
      throw new InvalidValueError(`invalid path type: ${typeof path}, should be string`);
    }
    return (req) => {
      req.setPath(path);
    };
  },
  hasCookie(key) {
    if (!isString(key)) {
      throw new InvalidValueError(`invalid cookie key type: ${typeof key}, should be string`);
    }
    return (req) => {
      if (!req.hasCookie(key)) {
        throw new RuleViolationError(`request does not have cookie: ${key}`);
      }
    };
  },
  refererBelongsTo(domain) {
    if (!isString(domain)) {
      throw new InvalidValueError(`invalid referer type: ${typeof domain}, should be string`);
    }
    return (req) => {
      if (!req.refererBelongsTo(domain)) {
        throw new RuleViolationError(`request referer does not belongs to: ${domain}`);
      }
    };
  },
  RuleViolationError,
};

export default httprule;
export {
  METHODS,
};
