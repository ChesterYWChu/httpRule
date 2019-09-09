import {
  expect,
} from 'chai';
import fs from 'fs';
import httprule, {
  METHODS,
} from '../src/httprule';


const outputDir = './test/output';

function createOuputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
}

function getDefaultTransformer(format) {
  const tf = httprule.createTranformer({
    format,
  });

  tf.addRules([{
    conditions: {
      method: [METHODS.GET],
      path: ['/shopback/resource'],
    },
    actions: [
      httprule.updatePath('/shopback/static/assets'),
    ],
  }, {
    conditions: {
      method: [METHODS.GET],
      path: ['/shopback/me'],
    },
    actions: [
      httprule.hasCookie('sbcookie'),
    ],
  }, {
    conditions: {
      method: [METHODS.GET],
    },
    actions: [
      httprule.refererBelongsTo('www.shopback.com'),
    ],
  }, {
    conditions: {
      method: [METHODS.GET],
      path: ['/shopback/api/*'],
    },
    actions: [
      httprule.addHeader('From', 'hello@shopback.com'),
    ],
  }, {
    conditions: {
      method: [METHODS.POST, METHODS.PUT],
    },
    actions: [
      httprule.removeAllURLQueryString(),
    ],
  }, {
    conditions: {
      method: [METHODS.POST, METHODS.PUT],
    },
    actions: [
      httprule.hasHeader('X-SHOPBACK-AGENT'),
    ],
  }, {
    conditions: {
      method: [METHODS.POST, METHODS.PUT],
    },
    actions: [
      httprule.hasHeaderWithValues('Content-Type', ['application/json']),
    ],
  }, {
    conditions: {
      method: [METHODS.DELETE],
    },
    actions: [
      httprule.hasHeaderWithValues('X-SHOPBACK-AGENT', ['AGENT_1', 'AGENT_2']),
    ],
  }, {
    actions: [
      httprule.addHeader('X-SHOPBACK-TIMESTAMP', () => new Date().getTime()),
    ],
  }, {
    actions: [
      httprule.allowDomains(['www.shopback.com', 'www.shopback.com.tw']),
    ],
  }]);
  return tf;
}

describe('#transform synchronously', () => {
  it('should transform request correctly', (done) => {
    const tf = getDefaultTransformer('json');

    createOuputDir();
    const outputPath = `${outputDir}/transformSynchronously.json`;
    const startTime = new Date().getTime();
    tf.transformSync('./test/test.json', outputPath);

    const outputReq = tf.parseInput(outputPath);
    expect(outputReq.getDomain()).to.be.equal('www.shopback.com');
    expect(outputReq.getPath()).to.be.equal('/some/resource');
    expect(outputReq.getURL()).to.be.equal('http://www.shopback.com/some/resource');

    expect(outputReq.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
    expect(outputReq.getHeaders()['X-SHOPBACK-TIMESTAMP']).to.be.at.least(startTime);
    done();
  });
});

describe('#transform asynchronously', () => {
  it('should transform request correctly', (done) => {
    const tf = getDefaultTransformer('json');

    createOuputDir();
    const outputPath = `${outputDir}/transformAsynchronously.json`;
    const startTime = new Date().getTime();
    tf.transform('./test/test.json', outputPath, null, (err) => {
      expect(err).to.be.equal(null);
      const outputReq = tf.parseInput(outputPath);
      expect(outputReq.getDomain()).to.be.equal('www.shopback.com');
      expect(outputReq.getPath()).to.be.equal('/some/resource');
      expect(outputReq.getURL()).to.be.equal('http://www.shopback.com/some/resource');

      expect(outputReq.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
      expect(outputReq.getHeaders()['X-SHOPBACK-TIMESTAMP']).to.be.at.least(startTime);
      done();
    });
  });
});

describe('#transform by stream with json format', () => {
  it('should transform input json stream and pipe to output stream', (done) => {
    const tf = getDefaultTransformer('json');


    const outputPath = `${outputDir}/transformByStream.json`;
    const startTime = new Date().getTime();
    const inputFileStream = fs.createReadStream('./test/test.json');
    const outputFileStream = fs.createWriteStream(outputPath);

    const tfStream = tf.getTransformStream();
    inputFileStream.pipe(tfStream).pipe(outputFileStream).on('finish', () => {
      const outputReq = tf.parseInput(outputPath);
      expect(outputReq.getDomain()).to.be.equal('www.shopback.com');
      expect(outputReq.getPath()).to.be.equal('/some/resource');
      expect(outputReq.getURL()).to.be.equal('http://www.shopback.com/some/resource');

      expect(outputReq.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
      expect(outputReq.getHeaders()['X-SHOPBACK-TIMESTAMP']).to.be.at.least(startTime);
      done();
    });
  });
});

describe('#transform by stream with yaml format', () => {
  it('should transform input yaml stream and pipe to output stream', (done) => {
    const tf = getDefaultTransformer('yaml');


    const outputPath = `${outputDir}/transformByStream.yaml`;
    const startTime = new Date().getTime();
    const inputFileStream = fs.createReadStream('./test/test.yaml');
    const outputFileStream = fs.createWriteStream(outputPath);

    const tfStream = tf.getTransformStream();
    inputFileStream.pipe(tfStream).pipe(outputFileStream).on('finish', () => {
      const outputReq = tf.parseInput(outputPath);
      expect(outputReq.getDomain()).to.be.equal('www.shopback.com');
      expect(outputReq.getPath()).to.be.equal('/some/resource');
      expect(outputReq.getURL()).to.be.equal('http://www.shopback.com/some/resource');

      expect(outputReq.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
      expect(outputReq.getHeaders()['X-SHOPBACK-TIMESTAMP']).to.be.at.least(startTime);
      done();
    });
  });
});
