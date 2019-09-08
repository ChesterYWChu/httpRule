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
    expect(req.domain).to.be.equal('www.shopback.com');
    expect(req.path).to.be.equal('/some/resource');
    expect(req.method).to.be.equal('POST');
    expect(req.headers.Cookie).to.be.equal('name=value; name2=value2; name3=value3');
    expect(req.headers['Content-Type']).to.be.equal('application/json');
    expect(req.headers['X-SHOPBACK-AGENT']).to.be.equal('anything');
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
    expect(req.domain).to.be.equal('www.shopback.com');
    expect(req.path).to.be.equal('/some/resource');
    expect(req.method).to.be.equal('POST');
    expect(req.headers.Cookie).to.be.equal('name=value; name2=value2; name3=value3');
    expect(req.headers['Content-Type']).to.be.equal('application/json');
    expect(req.headers['X-SHOPBACK-AGENT']).to.be.equal('anything');
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
      'www.shopback.com', '/shopback/resource', 'GET', {
        Cookie: 'name=value; name2=value2; name3=value3',
        'Content-Type': 'application/json',
        'X-SHOPBACK-AGENT': 'anything',
      },
    );
    tf.tranformRequest(req);
    expect(req.domain).to.be.equal('www.shopback.com');
    expect(req.path).to.be.equal('/shopback/static/assets');
    expect(req.method).to.be.equal('GET');
    done();
  });
  it('should not update request path since method does not match condition', (done) => {
    const req = request.createRequest(
      'www.shopback.com', '/shopback/resource', 'POST', {},
    );
    tf.tranformRequest(req);
    expect(req.domain).to.be.equal('www.shopback.com');
    expect(req.path).to.be.equal('/shopback/resource');
    expect(req.method).to.be.equal('POST');
    done();
  });
  it('should not update request path since path does not match condition', (done) => {
    const req = request.createRequest(
      'www.google.com', '/some/resource', 'GET', {},
    );
    tf.tranformRequest(req);
    expect(req.domain).to.be.equal('www.google.com');
    expect(req.path).to.be.equal('/some/resource');
    expect(req.method).to.be.equal('GET');
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
      'www.shopback.com', '/shopback/me', 'GET', {
        Cookie: 'sbcookie=sbvalue; name=value; name2=value2; name3=value3',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should throw RuleViolationError when cookie key is missing', (done) => {
    const req = request.createRequest(
      'www.shopback.com', '/shopback/me', 'GET', {
        Cookie: 'name=value; name2=value2; name3=value3',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
  it('should throw RuleViolationError when cookie is missing', (done) => {
    const req = request.createRequest(
      'www.shopback.com', '/shopback/me', 'GET', {},
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
      'www.google.com', '/path/to/resource', 'GET', {
        referer: 'http://www.shopback.com/some/resource',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should pass rule with referer https://www.shopback.com/some/resource', (done) => {
    const req = request.createRequest(
      'www.google.com', '/path/to/resource', 'GET', {
        referer: 'https://www.shopback.com/some/resource',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.not.throw();
    done();
  });
  it('should throw RuleViolationError when referer is missing', (done) => {
    const req = request.createRequest(
      'www.google.com', '/path/to/resource', 'GET', {},
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
  it('should throw RuleViolationError with referer http://www.google.com/some/resource', (done) => {
    const req = request.createRequest(
      'www.google.com', '/path/to/resource', 'GET', {
        referer: 'http://www.google.com/some/resource',
      },
    );
    expect(tf.tranformRequest.bind(tf, req)).to.throw(httprule.RuleViolationError);
    done();
  });
});
