import {
  expect,
} from 'chai';
import httprule from '../src/httprule';
import request from '../src/request';

describe('#average', () => {
  it('should return Hello test', (done) => {
    const tf = httprule.createTranformer('test');
    expect(tf.sayHello()).to.be.equal('Hello test');
    done();
  });
  it('should update the request path', (done) => {
    const tf = httprule.createTranformer('test');
    tf.rule({
      conditions: {
        method: [],
        domain: [],
        path: [],
      },
      actions: [
        tf.updatePath('/shopback/static/assets'),
      ],
    });
    // expect(tf.sayHello()).to.be.equal('Hello test');

    const req = request.createRequest('', '/shopback/resource', 'GET', '');
    tf.transform(req);
    expect(req.path).to.be.equal('/shopback/static/assets');
    done();
  });
  // it('should return NaN when array is empty', (done) => {
  //   done();
  // });
});
