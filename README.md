# httpRule
a middleware to tranform http request

### Features
* configurable transform rules
* support file input/output
* support Readable/Writable stream as input/output
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
      method: [httprule.METHODS.GET],
      path: ['/shopback/resource'],
    },
    actions: [
      httprule.updatePath('/shopback/static/assets'),
    ],
  },{
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

### Supported Conditions
* method filtering
* domain url-pattern filtering
* path url-pattern filtering


### Supported Actions
* updatePath(path)
* hasCookie(key)
* refererBelongsTo(domain)
* addHeader(key, value)
* removeAllURLQueryString()
* addURLQueryString(key, value)
* deleteURLQueryString(key)
* hasHeader(key)
* hasHeaderWithValues(key, values)
* allowDomains(domains)

