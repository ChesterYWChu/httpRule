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


function isReadableStream(stream) {
  return stream instanceof EventEmitter && typeof stream.read === 'function';
}

// function isWritableStream(stream) {
//   return stream instanceof EventEmitter && typeof stream.write === 'function' &&
// typeof stream.end === 'function';
// }


function HTTPTransformer(opt) {
  if (OPTIONS.KEY_NAME in opt) {
    this.name = opt[OPTIONS.KEY_NAME];
  }
  if (OPTIONS.KEY_FORMAT in opt) {
    if (!Object.values(OPTIONS.FORMAT).includes(opt[OPTIONS.KEY_FORMAT])) {
      throw new InvalidValueError(`unsurported format: ${opt[OPTIONS.KEY_FORMAT]}, should be "json"|"yaml"`);
    }
    this.format = opt[OPTIONS.KEY_FORMAT];
    this.parser = this.loadParser(this.format);
  }
  if (OPTIONS.KEY_IO in opt) {
    if (!Object.values(OPTIONS.IO).includes(opt[OPTIONS.KEY_IO])) {
      throw new InvalidValueError(`unsurported IO type: ${this.io}, should be "file"|"stream"`);
    }
    this.io = opt[OPTIONS.KEY_IO];
  }
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
    try {
      req = this.parseInput(input);
    } catch (error) {
      // if (key in object) {
      //   throw InvalidValueError.prepend(`in property "${  key  }"`, error);
      // } else {
      //   throw new InvalidValueError(`missing property "${  key  }"`);
      // }
    }
    this.rules.forEach((rule) => {
      if (this.matchCondition(req, rule)) {
        this.doActions(req, rule);
      }
    });
  },

  parseInput(input) {
    const data = this.readData(input);
    return this.parser(data);
  },
  readData(input) {
    if (this.io === OPTIONS.IO.FILE) {
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
  matchCondition(req, rule) {
    if ('condition' in rule) {
      rule.condition.forEach();
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
  request,
  createTranformer: (opt) => new HTTPTransformer(opt),
  updatePath(path) {
    return (req) => {
      req.setPath(path);
    };
  },
};

export default httprule;
