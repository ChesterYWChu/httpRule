# httpRule
a middleware to transform http request

### Features
* configurable transform rules
* support file path as input/output
* support Readable/Writable stream as input/output
* support both synchronously and asynchronously transform
* support json/yaml format data
* support adding custom data format parser/dumper (ex: XML)
* support domain and path url-pattern filtering

### Build
```shell
  npm run build
```

### Test
```shell
  npm run test
```

### Examples
##### if HTTP method is GET and path is '/shopback/resource', update the path to '/shopback/static/assets'
```javascript
  // create and config transformer
  const tf = httprule.createTransformer({
    format: 'json',
  });

  // add one rule
  tf.addRule({
    conditions: {
      method: [httprule.METHODS.GET],
      path: ['/shopback/resource'],
    },
    actions: [
      httprule.updatePath('/shopback/static/assets'),
    ],
  });
  // synchronously transform json request from input file, and write result to output file
  tf.transformSync('input/file/path', 'output/file/path');
```

##### add multiple rules at once
```javascript
  // create and config transformer
  const tf = httprule.createTransformer({
    format: 'yaml',
  });

  // add multiple rules
  tf.addRules([{
    conditions: {
      method: [httprule.METHODS.POST, httprule.METHODS.PUT],
      path: ['/shopback/resource'],
    },
    actions: [
      httprule.updatePath('/shopback/static/assets'),
      httprule.hasHeader('Content-Type'),
    ],
  },{
    // use url-pattern to filter path
    conditions: {
      path: ['/shopback/api/*'],
    },
    // add a header with current timestamp as value
    actions: [
      httprule.addHeader('X-SHOPBACK-TIMESTAMP', () => new Date().getTime()),
    ],
  }]);

  // asynchronously transform json request from input file, and write result to output file
  tf.transform('input/file/path', 'output/file/path', null, (err) => {
    console.log(err);
  });
```

##### take Readable/Writable stream as input/output
```javascript
  import fs from 'fs';

  ...

  const tfStream = tf.getTransformStream();
  const inputFileStream = fs.createReadStream('/input/file/path');
  const outputFileStream = fs.createWriteStream('/output/file/path');  
  inputFileStream.pipe(tfStream).pipe(outputFileStream).on('finish', () => {
    console.log('finish');
  });
```

##### use custom XML parser/dumper
```javascript
  import xml2js from 'xml2js';

  ...

  // set custom XML parser
  tf.setParser((data) => {
    const parser = new xml2js.Parser();
    parser.parseString(data, function(err,result){
    return httprule.request.createRequest(
      result['url'],
      result['method'],
      result['headers']
    ); 
  });
  // set custom XML dumper
  tf.setDumper((requestObject) => {
    const builder = new xml2js.Builder();
    return builder.buildObject(requestObject);
  });

  tf.transformSync('input/file/path', 'output/file/path');
```

### Supported Conditions
* method filtering
* domain url-pattern filtering
* path url-pattern filtering


### Supported Actions
* updatePath(path)
* hasCookie(key)
* hasCookieWithValues(key, value)
* refererBelongsTo(domain)
* addHeader(key, value)
* removeAllURLQueryString()
* addURLQueryString(key, value)
* deleteURLQueryString(key)
* hasHeader(key)
* hasHeaderWithValues(key, values)
* allowDomains(domains)

### Notes
* Use javascript ES6 syntax and convert to node compatable syntax with babel
* Use mocha/chai as test framework
* Follow Airbnb ESLint style

