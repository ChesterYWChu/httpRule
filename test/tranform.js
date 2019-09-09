import {
  expect,
} from 'chai';
import fs from 'fs';
import xml2js, {
  parseString as parseXMLString,
} from 'xml2js';
import httprule from '../src/httprule';

const outputDir = './test/output';

// create a new output directory if not exist
function createOuputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
}

// return a default transformer with 10 default rules
function getDefaultTransformer(format) {
  const tf = httprule.createTransformer({
    format,
  });

  tf.addRules([{
    // rule 1
    conditions: {
      method: [httprule.METHODS.GET],
      path: ['/shopback/resource'],
    },
    actions: [
      httprule.updatePath('/shopback/static/assets'),
    ],
  }, {
    // rule 2
    conditions: {
      method: [httprule.METHODS.GET],
      path: ['/shopback/me'],
    },
    actions: [
      httprule.hasCookie('sbcookie'),
    ],
  }, {
    // rule 3
    conditions: {
      method: [httprule.METHODS.GET],
    },
    actions: [
      httprule.refererBelongsTo('www.shopback.com'),
    ],
  }, {
    // rule 4
    conditions: {
      method: [httprule.METHODS.GET],
      path: ['/shopback/api/*'],
    },
    actions: [
      httprule.addHeader('From', 'hello@shopback.com'),
    ],
  }, {
    // rule 5
    conditions: {
      method: [httprule.METHODS.POST, httprule.METHODS.PUT],
    },
    actions: [
      httprule.removeAllURLQueryString(),
    ],
  }, {
    // rule 6
    conditions: {
      method: [httprule.METHODS.POST, httprule.METHODS.PUT],
    },
    actions: [
      httprule.hasHeader('X-SHOPBACK-AGENT'),
    ],
  }, {
    // rule 7
    conditions: {
      method: [httprule.METHODS.POST, httprule.METHODS.PUT],
    },
    actions: [
      httprule.hasHeaderWithValues('Content-Type', ['application/json']),
    ],
  }, {
    // rule 8
    conditions: {
      method: [httprule.METHODS.DELETE],
    },
    actions: [
      httprule.hasHeaderWithValues('X-SHOPBACK-AGENT', ['AGENT_1', 'AGENT_2']),
    ],
  }, {
    // rule 9
    actions: [
      httprule.addHeader('X-SHOPBACK-TIMESTAMP', () => new Date().getTime()),
    ],
  }, {
    // rule 10
    actions: [
      httprule.allowDomains(['www.shopback.com', 'www.shopback.com.tw']),
    ],
  }]);
  return tf;
}

describe('#E2E Test: transform synchronously', () => {
  it('should transform request correctly', (done) => {
    const tf = getDefaultTransformer('json');

    createOuputDir();
    const outputPath = `${outputDir}/transformSynchronously.json`;
    const startTime = new Date().getTime();
    tf.transformSync('./test/input/test.json', outputPath);

    const outputReq = tf.parseInput(outputPath);
    expect(outputReq.getDomain()).to.be.equal('www.shopback.com');
    expect(outputReq.getPath()).to.be.equal('/some/resource');
    expect(outputReq.getURL()).to.be.equal('http://www.shopback.com/some/resource');

    expect(outputReq.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
    expect(outputReq.getHeaders()['X-SHOPBACK-TIMESTAMP']).to.be.at.least(startTime);
    done();
  });
});

describe('#E2E Test: transform asynchronously', () => {
  it('should transform request correctly', (done) => {
    const tf = getDefaultTransformer('json');

    createOuputDir();
    const outputPath = `${outputDir}/transformAsynchronously.json`;
    const startTime = new Date().getTime();
    tf.transform('./test/input/test.json', outputPath, null, (err) => {
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

describe('#E2E Test: transform by stream with json format', () => {
  it('should transform input json stream and pipe to output stream', (done) => {
    const tf = getDefaultTransformer('json');


    const outputPath = `${outputDir}/transformByStream.json`;
    const startTime = new Date().getTime();
    const inputFileStream = fs.createReadStream('./test/input/test.json');
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

describe('#E2E Test: transform by stream with yaml format', () => {
  it('should transform input yaml stream and pipe to output stream', (done) => {
    const tf = getDefaultTransformer('yaml');


    const outputPath = `${outputDir}/transformByStream.yaml`;
    const startTime = new Date().getTime();
    const inputFileStream = fs.createReadStream('./test/input/test.yaml');
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

describe('#E2E Test: transform with custom parser/dumper', () => {
  it('should be able to transform input xml file', (done) => {
    const tf = getDefaultTransformer(null);

    // set custom XML parser
    tf.setCustomParser((data) => {
      let dataObj;
      parseXMLString(data, {
        explicitArray: false,
      }, (err, result) => {
        if (err) {
          throw new Error(`parse XML error: ${err}`);
        }
        const resultObj = result.root;
        dataObj = {
          url: resultObj.url,
          method: resultObj.method,
          headers: resultObj.headers,
        };
      });
      return dataObj;
    });
    // set custom XML dumper
    tf.setCustomDumper((requestObject) => {
      const builder = new xml2js.Builder();
      return builder.buildObject(requestObject);
    });

    createOuputDir();
    const outputPath = `${outputDir}/transformByCustomXMLParser.xml`;
    const startTime = new Date().getTime();
    tf.transformSync('./test/input/test.xml', outputPath);

    const outputReq = tf.parseInput(outputPath);
    expect(outputReq.getDomain()).to.be.equal('www.shopback.com');
    expect(outputReq.getPath()).to.be.equal('/some/resource');
    expect(outputReq.getURL()).to.be.equal('http://www.shopback.com/some/resource');

    expect(outputReq.getHeaders()).to.have.property('X-SHOPBACK-TIMESTAMP');
    const ts = parseInt(outputReq.getHeaders()['X-SHOPBACK-TIMESTAMP'], 10);
    expect(ts).to.be.at.least(startTime);
    done();
  });
});
