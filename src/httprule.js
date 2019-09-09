import {
  Transform,
} from 'stream';
import fs from 'fs';
import request from './request';
import utils from './utils';

// transformer config constants
const OPTIONS = {
  KEY_FORMAT: 'format',
  FORMAT: {
    JSON: 'json',
    YAML: 'yaml',
  },
};

// invalid config value error
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

// rule violation error
function RuleViolationError(message) {
  this.message = message;
  this.name = 'RuleViolationError';
  Error.captureStackTrace(this, RuleViolationError);
}
RuleViolationError.prototype = Object.create(Error.prototype);
RuleViolationError.prototype.constructor = RuleViolationError;

// HTTPTransformer constructor
function HTTPTransformer(opt) {
  this.format = OPTIONS.FORMAT.JSON;
  if (typeof opt === 'object') {
    if (OPTIONS.KEY_FORMAT in opt) {
      if (!Object.values(OPTIONS.FORMAT).includes(opt[OPTIONS.KEY_FORMAT])) {
        throw new InvalidValueError(`unsurported format: ${opt[OPTIONS.KEY_FORMAT]}, should be "json"|"yaml"`);
      }
      this.format = opt[OPTIONS.KEY_FORMAT];
    }
  }
  [this.parser, this.dumper] = this.loadParserAndDumper(this.format);
  this.rules = [];
  this.data = '';
}

// HTTPTransformer properties
HTTPTransformer.prototype = {
  constructor: HTTPTransformer,
  // add rule to transformer, rule: object
  addRule(rule) {
    this.rules.push(rule);
  },
  // add multiple rules to transformer, rules:Array of object
  addRules(rules) {
    this.rules.push(...rules);
  },
  // transform request asynchronously
  transform(input, output, format, callback) {
    if (!utils.isString(input)) {
      callback(new InvalidValueError(`invalid input type: ${typeof input}, should be string`));
    }
    if (!utils.isString(output)) {
      callback(new InvalidValueError(`invalid output type: ${typeof output}, should be string`));
    }
    if (format && !utils.isString(format)) {
      callback(new InvalidValueError(`invalid format type: ${typeof format}, should be string`));
    }
    fs.readFile(input, 'utf8', (error, data) => {
      if (error) {
        callback(error);
      }
      let outputData;
      try {
        let [parser, dumper] = [this.parser, this.dumper];
        if (format) {
          [parser, dumper] = this.loadParserAndDumper(format);
        }
        // parse data
        const req = parser(data);

        // transform request
        this.transformRequest(req);
        outputData = dumper(req);
      } catch (err) {
        callback(err);
      }

      // dump outputdata to file
      fs.writeFile(output, outputData, 'utf8', (err) => {
        callback(err);
      });
    });
  },
  // transform request synchronously
  transformSync(input, output, format) {
    if (!utils.isString(input)) {
      throw new InvalidValueError(`invalid input type: ${typeof input}, should be string`);
    }
    if (!utils.isString(output)) {
      throw new InvalidValueError(`invalid output type: ${typeof output}, should be string`);
    }
    if (format && !utils.isString(format)) {
      throw new InvalidValueError(`invalid output type: ${typeof format}, should be string`);
    }
    const req = this.parseInput(input, format);
    this.transformRequest(req);
    this.writeOutput(output, req, format);
  },
  // return an instance of transform type stream to handle input/output stream
  getTransformStream() {
    const that = this;
    const transformStream = new Transform({
      // decodeStrings: true,
      // objectMode: false,
      transform(chunk, encoding, callback) {
        that.data += chunk;
        callback();
      },
      flush(callback) {
        const req = that.parser(that.data);
        that.transformRequest(req);
        this.push(that.dumper(req));
        that.data = '';
        callback();
      },
    });
    return transformStream;
  },
  // parser input file into request object
  parseInput(input, format) {
    const data = fs.readFileSync(input, 'utf8');
    let {
      parser,
    } = this;
    if (format) {
      [parser] = this.loadParserAndDumper(format);
    }
    return parser(data);
  },
  // return parser/dumper according to input format
  loadParserAndDumper(format) {
    let parser;
    let dumper;
    switch (format) {
      case OPTIONS.FORMAT.JSON:
        parser = request.JSONParser;
        dumper = request.JSONDumper;
        break;
      case OPTIONS.FORMAT.YAML:
        parser = request.YAMLParser;
        dumper = request.YAMLDumper;
        break;
      default:
        throw new InvalidValueError(`unsurported format: ${format}, should be "json"|"yaml"`);
    }
    return [parser, dumper];
  },
  setCustomParser(parser) {
    this.parser = parser;
  },
  setCustomDumper(dumper) {
    this.dumper = dumper;
  },
  // write request object into output file
  writeOutput(output, req, format) {
    let {
      dumper,
    } = this;
    if (format) {
      // eslint-disable-next-line no-undef
      [parser, dumper] = this.loadParserAndDumper(format);
    }
    const data = dumper(req);
    fs.writeFileSync(output, data, 'utf8');
  },
  // transform input request object by rules, return transformed request object
  transformRequest(req) {
    this.rules.forEach((rule) => {
      if (this.matchCondition(req, rule)) {
        this.doActions(req, rule);
      }
    });
  },
  // check if the request object match the rule conditions
  matchCondition(req, rule) {
    if ('conditions' in rule) {
      const keys = Object.keys(rule.conditions);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const condition = rule.conditions[key];
        switch (key) {
          case 'domain':
            if (!utils.matchOneOfURLPatterns(condition, req.getDomain())) {
              return false;
            }
            break;
          case 'path':
            if (!utils.matchOneOfURLPatterns(condition, req.getPath())) {
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
  // excute rule actions
  doActions(req, rule) {
    if ('actions' in rule) {
      rule.actions.forEach((action) => {
        action(req);
      });
    }
  },
};

const httprule = {
  // sub module - request
  request,
  // http methods
  METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
  },
  // create transformer instance
  createTransformer: (opt) => new HTTPTransformer(opt),
  updatePath(path) {
    if (!utils.isString(path)) {
      throw new InvalidValueError(`invalid path type: ${typeof path}, should be string`);
    }
    return (req) => {
      req.setPath(path);
    };
  },
  // action: check if target key exist in header cookie
  hasCookie(key) {
    if (!utils.isString(key)) {
      throw new InvalidValueError(`invalid cookie key type: ${typeof key}, should be string`);
    }
    return (req) => {
      if (!req.hasCookie(key)) {
        throw new RuleViolationError(`request does not have cookie: ${key}`);
      }
    };
  },
  // action: check if referer is belongs to target domain
  refererBelongsTo(domain) {
    if (!utils.isString(domain)) {
      throw new InvalidValueError(`invalid referer type: ${typeof domain}, should be string`);
    }
    return (req) => {
      if (!req.refererBelongsTo(domain)) {
        throw new RuleViolationError(`request referer does not belongs to: ${domain}`);
      }
    };
  },
  // action: add a header with key and value
  // key:string, value:string or a callback function that returns a string
  addHeader(key, value) {
    if (!utils.isString(key)) {
      throw new InvalidValueError(`invalid header key type: ${typeof key}, should be string`);
    }
    if (!utils.isString(value) && !utils.isFunction(value)) {
      throw new InvalidValueError(`invalid header value type: ${typeof value}, should be string or function`);
    }
    return (req) => {
      req.addHeader(key, value);
    };
  },
  // action: remove all query strings in url
  removeAllURLQueryString() {
    return (req) => {
      req.removeAllURLQueryString();
    };
  },
  // action: add an url query string
  addURLQueryString(key, value) {
    return (req) => {
      req.addURLQueryString(key, value);
    };
  },
  // action: delete an url query string
  deleteURLQueryString(key) {
    return (req) => {
      req.deleteURLQueryString(key);
    };
  },
  // action: check if target key exist in headers
  hasHeader(key) {
    if (!utils.isString(key)) {
      throw new InvalidValueError(`invalid header key type: ${typeof key}, should be string`);
    }
    return (req) => {
      if (!req.hasHeader(key)) {
        throw new RuleViolationError(`request does not have header: ${key}`);
      }
    };
  },
  // action: check if the target header value equals to one of the values
  hasHeaderWithValues(key, values) {
    if (!utils.isString(key)) {
      throw new InvalidValueError(`invalid header key type: ${typeof key}, should be string`);
    }
    if (!utils.isArray(values)) {
      throw new InvalidValueError(`invalid values type: ${typeof values}, should be Array`);
    }
    return (req) => {
      if (!req.hasHeaderWithValues(key, values)) {
        throw new RuleViolationError(`request does not have header key: ${key} with value: ${values}`);
      }
    };
  },
  // action: check if the domain is in allowed domains
  allowDomains(domains) {
    if (!utils.isArray(domains)) {
      throw new InvalidValueError(`invalid allow domains type: ${typeof domains}, should be Array`);
    }
    return (req) => {
      if (!req.allowDomains(domains)) {
        throw new RuleViolationError(`request domain is not allow, should be one of ${domains}`);
      }
    };
  },
  RuleViolationError,
};

export default httprule;
