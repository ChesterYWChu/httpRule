import {
  expect,
} from 'chai';
import httprule from '../src/httprule';

// describe('#rule 1', () => {
//   it('should return Hello test', (done) => {
//     const tf = httprule.createTranformer('test');
//     expect(tf.sayHello()).to.be.equal('Hello test');
//     done();
//   });
//   it('should update the request path', (done) => {
//     const tf = httprule.createTranformer('test');
//     tf.addRule({
//       conditions: {
//         method: [],
//         domain: [],
//         path: [],
//       },
//       actions: [
//         httprule.updatePath('/shopback/static/assets'),
//       ],
//     });
//     // expect(tf.sayHello()).to.be.equal('Hello test');

//     const req = request.createRequest('', '/shopback/resource', 'GET', '');
//     tf.transform(req);
//     expect(req.path).to.be.equal('/shopback/static/assets');
//     done();
//   });
//   // it('should return NaN when array is empty', (done) => {
//   //   done();
//   // });
// });

describe('#json file input', () => {
  it('should parse json file into request object', (done) => {
    const tf = httprule.createTranformer({
      format: 'json',
      io: 'file_path',
    });
    const req = tf.parseInput('./test/test.json');
    console.log(req);
    expect(req.domain).to.be.equal('www.shopback.com');
    expect(req.path).to.be.equal('/some/resource');
    expect(req.method).to.be.equal('POST');
    done();
  });
});
