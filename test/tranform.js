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

describe('#transform synchronously', () => {
  it('should transform request correctly', (done) => {
    const tf = httprule.createTranformer({
      format: 'json',
    });
    tf.addRules([{
      conditions: {
        method: [METHODS.POST, METHODS.PUT],
      },
      actions: [
        httprule.removeAllURLQueryString(),
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
    const tf = httprule.createTranformer({
      format: 'json',
    });
    tf.addRules([{
      conditions: {
        method: [METHODS.POST, METHODS.PUT],
      },
      actions: [
        httprule.removeAllURLQueryString(),
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
