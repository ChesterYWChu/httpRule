import {
  expect,
} from 'chai';
import httprule, {
  METHODS,
} from '../src/httprule';
import request from '../src/request';

describe('#json file input', () => {
  it('should parse json file into request object', (done) => {
    const tf = httprule.createTranformer({
      format: 'json',
      io: 'file',
    });
    const req = tf.parseInput('./test/test.json');
    expect(req.getDomain()).to.be.equal('www.shopback.com');
    expect(req.getPath()).to.be.equal('/some/resource');
    expect(req.getMethod()).to.be.equal('POST');
    expect(req.getHeaders().Cookie).to.be.equal('name=value; name2=value2; name3=value3');
    expect(req.getHeaders()['Content-Type']).to.be.equal('application/json');
    expect(req.getHeaders()['X-SHOPBACK-AGENT']).to.be.equal('anything');
    done();
  });
});

describe('#yaml file input', () => {
  it('should parse yaml file into request object', (done) => {
    const tf = httprule.createTranformer({
      format: 'yaml',
      io: 'file',
    });
    const req = tf.parseInput('./test/test.yaml');
    expect(req.getDomain()).to.be.equal('www.shopback.com');
    expect(req.getPath()).to.be.equal('/some/resource');
    expect(req.getMethod()).to.be.equal('POST');
    expect(req.getHeaders().Cookie).to.be.equal('name=value; name2=value2; name3=value3');
    expect(req.getHeaders()['Content-Type']).to.be.equal('application/json');
    expect(req.getHeaders()['X-SHOPBACK-AGENT']).to.be.equal('anything');
    done();
  });
});

describe('#rule 1 - update path', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.GET],
      path: ['/shopback/resource'],
    },
    actions: [
      httprule.updatePath('/shopback/static/assets'),
    ],
  });
  it('should update request path', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/shopback/resource', 'GET', {
        Cookie: 'name=value; name2=value2; name3=value3',
        'Content-Type': 'application/json',
        'X-SHOPBACK-AGENT': 'anything',
      },
    );
    tf.tranformRequest(req);
    expect(req.getDomain()).to.be.equal('www.shopback.com');
    expect(req.getPath()).to.be.equal('/shopback/static/assets');
    expect(req.getMethod()).to.be.equal('GET');
    expect(req.getURL()).to.be.equal('http://www.shopback.com/shopback/static/assets');
    done();
  });
  it('should not update request path since method does not match condition', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/shopback/resource', 'POST', {},
    );
    tf.tranformRequest(req);
    expect(req.getDomain()).to.be.equal('www.shopback.com');
    expect(req.getPath()).to.be.equal('/shopback/resource');
    expect(req.getMethod()).to.be.equal('POST');
    expect(req.getURL()).to.be.equal('http://www.shopback.com/shopback/resource');
    done();
  });
  it('should not update request path since path does not match condition', (done) => {
    const req = request.createRequest(
      'http://www.google.com/some/resource', 'GET', {},
    );
    tf.tranformRequest(req);
    expect(req.getDomain()).to.be.equal('www.google.com');
    expect(req.getPath()).to.be.equal('/some/resource');
    expect(req.getMethod()).to.be.equal('GET');
    expect(req.getURL()).to.be.equal('http://www.google.com/some/resource');
    done();
  });
});


describe('#rule 2 - has cookie sbcookie', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.GET],
      path: ['/shopback/me'],
    },
    actions: [
      httprule.hasCookie('sbcookie'),
    ],
  });
  it('should pass rule', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/shopback/me', 'GET', {
        Cookie: 'sbcookie=sbvalue; name=value; name2=value2; name3=value3',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should throw RuleViolationError when cookie key is missing', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/shopback/me', 'GET', {
        Cookie: 'name=value; name2=value2; name3=value3',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
  it('should throw RuleViolationError when cookie is missing', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/shopback/me', 'GET', {},
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
});

describe('#rule 3 - referer belongs to www.shopback.com', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.GET],
    },
    actions: [
      httprule.refererBelongsTo('www.shopback.com'),
    ],
  });
  it('should pass rule with referer http://www.shopback.com/some/resource', (done) => {
    const req = request.createRequest(
      'http://www.google.com/path/to/resource', 'GET', {
        referer: 'http://www.shopback.com/some/resource',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should pass rule with referer https://www.shopback.com/some/resource', (done) => {
    const req = request.createRequest(
      'http://www.google.com/path/to/resource', 'GET', {
        referer: 'https://www.shopback.com/some/resource',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should throw RuleViolationError when referer is missing', (done) => {
    const req = request.createRequest(
      'http://www.google.com/path/to/resource', 'GET', {},
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
  it('should throw RuleViolationError with referer http://www.google.com/some/resource', (done) => {
    const req = request.createRequest(
      'http://www.google.com/path/to/resource', 'GET', {
        referer: 'http://www.google.com/some/resource',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
});

describe('#rule 4 - add header: From', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.GET],
      path: ['/shopback/api/*'],
    },
    actions: [
      httprule.addHeader('From', 'hello@shopback.com'),
    ],
  });
  it('should add From header to request object', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/shopback/api/path/to/resource', 'GET', {},
    );
    tf.tranformRequest(req);
    expect(req.getHeaders()).to.have.property('From');
    expect(req.getHeaders().From).to.be.equal('hello@shopback.com');
    done();
  });
  it('should add From header to request object with path /shopback/api/', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/shopback/api/', 'GET', {},
    );
    tf.tranformRequest(req);
    expect(req.getHeaders()).to.have.property('From');
    expect(req.getHeaders().From).to.be.equal('hello@shopback.com');
    done();
  });
  it('should not add From header to request object with path /some/resource', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/some/resource', 'GET', {},
    );
    tf.tranformRequest(req);
    expect(req.getHeaders()).to.not.have.property('From');
    done();
  });
});

describe('#rule 5 - remove all url query string', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.POST, METHODS.PUT],
    },
    actions: [
      httprule.removeAllURLQueryString(),
    ],
  });
  it('should remove all url query string with method POST', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api?query=string&id=1', 'POST', {},
    );
    tf.tranformRequest(req);
    expect(req.getURL()).to.be.equal('http://www.shopback.com/api');
    done();
  });
  it('should remove all url query string with method PUT', (done) => {
    const req = request.createRequest(
      'http://user:pass@www.shopback.com:8080/api?query=string&id=1#hash', 'PUT', {},
    );
    tf.tranformRequest(req);
    expect(req.getURL()).to.be.equal('http://user:pass@www.shopback.com:8080/api#hash');
    done();
  });
  it('should remain the same when the url has no query string', (done) => {
    const req = request.createRequest(
      'http://user:pass@www.shopback.com:8080/api#hash', 'PUT', {},
    );
    tf.tranformRequest(req);
    expect(req.getURL()).to.be.equal('http://user:pass@www.shopback.com:8080/api#hash');
    done();
  });
});

describe('#rule 6 - has header', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.POST, METHODS.PUT],
    },
    actions: [
      httprule.hasHeader('X-SHOPBACK-AGENT'),
    ],
  });
  it('should pass rule with header X-SHOPBACK-AGENT', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'POST', {
        'X-SHOPBACK-AGENT': 'value',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    expect(req.getURL()).to.be.equal('http://www.shopback.com/api');
    done();
  });
  it('should throw RuleViolationError when header X-SHOPBACK-AGENT is missing', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'POST', {
        'X-GOOGLE-AGENT': 'value',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
  it('should throw RuleViolationError when header X-SHOPBACK-AGENT is missing', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'POST',
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
});

describe('#rule 7 - has header value', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.POST, METHODS.PUT],
    },
    actions: [
      httprule.hasHeaderWithValues('Content-Type', ['application/json']),
    ],
  });
  it('should pass rule with header Content-Type:application/json', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'POST', {
        'Content-Type': 'application/json',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should throw RuleViolationError when Content-Type is text/plain', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'POST', {
        'Content-Type': 'text/plain',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
  it('should throw RuleViolationError when Content-Type is missing', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'POST', {
        Cookie: 'key=value;',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
});

describe('#rule 8 - has header value for DELETE method', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {
      method: [METHODS.DELETE],
    },
    actions: [
      httprule.hasHeaderWithValues('X-SHOPBACK-AGENT', ['AGENT_1', 'AGENT_2']),
    ],
  });
  it('should pass rule with header X-SHOPBACK-AGENT:AGENT_1', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'DELETE', {
        'X-SHOPBACK-AGENT': 'AGENT_1',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should throw RuleViolationError when X-SHOPBACK-AGENT is AGENT_10', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'DELETE', {
        'X-SHOPBACK-AGENT': 'AGENT_10',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
  it('should throw RuleViolationError when X-SHOPBACK-AGENT is missing', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'DELETE', {
        Cookie: 'key=value;',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
});

describe('#rule 9 - add header with value function', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {},
    actions: [
      httprule.addHeader('X-SHOPBACK-TIMESTAMP', () => new Date().getTime()),
    ],
  });
  it('should add timestamp to header X-SHOPBACK-TIMESTAMP', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'DELETE', {
        'X-SHOPBACK-AGENT': 'AGENT_1',
      },
    );
    const startTime = new Date().getTime();
    tf.tranformRequest(req);
    expect(req.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
    expect(req.getHeaders()['X-SHOPBACK-TIMESTAMP']).to.be.at.least(startTime);
    done();
  });
  it('should update timestamp of header X-SHOPBACK-TIMESTAMP', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'DELETE', {
        'X-SHOPBACK-TIMESTAMP': 0,
      },
    );
    const startTime = new Date().getTime();
    tf.tranformRequest(req);
    expect(req.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
    expect(req.getHeaders()['X-SHOPBACK-TIMESTAMP']).to.be.at.least(startTime);
    done();
  });
});

describe('#rule 10 - allow domains', () => {
  const tf = httprule.createTranformer();
  tf.addRule({
    conditions: {},
    actions: [
      httprule.allowDomains(['www.shopback.com', 'www.shopback.com.tw']),
    ],
  });
  it('should pass rule with domain www.shopback.com', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com/api', 'GET', {
        'X-SHOPBACK-AGENT': 'AGENT_1',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should pass rule with domain www.shopback.com.tw', (done) => {
    const req = request.createRequest(
      'http://www.shopback.com.tw/api', 'GET', {
        'X-SHOPBACK-AGENT': 'AGENT_1',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should throw RuleViolationError when domain is www.google.com', (done) => {
    const req = request.createRequest(
      'http://www.google.com/api', 'DELETE', {
        'X-SHOPBACK-AGENT': 'AGENT_1',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
});
