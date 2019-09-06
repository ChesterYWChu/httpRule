import request from './request';

// const http = require('http');
// http.createServer((req, res) => {
//   res.writeHead(200, {
//     'Content-Type': 'text/html',
//   });
//   res.end('Hello World!');
// }).listen(8080);


function HTTPRule(name) {
  this.name = name;
  this.rules = [];
}

HTTPRule.prototype = {
  constructor: HTTPRule,
  sayHello() {
    return `Hello ${this.name}`;
  },

  rule(rule) {
    this.rules.push(rule);
  },
  transform(req) {
    this.rules.forEach((rule) => {
      if (this.matchCondition(req, rule)) {
        this.doActions(req, rule);
      }
    });
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
  updatePath(path) {
    return (req) => {
      req.setPath(path);
    };
  },
};

const httprule = {
  request,
  createTranformer: (name) => new HTTPRule(name),
};

export default httprule;

// class Observable {
//   constructor() {
//     this.observers = {};
//   }

//   on(input, observer) {
//     if (!this.observers[input]) this.observers[input] = [];
//     this.observers[input].push(observer);
//   }

//   triggerInput(input, params) {
//     this.observers[input].forEach((o) => {
//       o.apply(null, params);
//     });
//   }
// }
