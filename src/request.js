// {
//   "url": "http://www.shopback.com/some/resource?q=1",
//   "method": "POST",
//   "headers": {
//     "Cookie": "name=value; name2=value2; name3=value3",
//     "Content-Type": "application/json",
//     "X-SHOPBACK-AGENT": "anything"
//   }
// }

function Request(domain, path, method, header) {
  this.domain = domain;
  this.path = path;
  this.method = method;
  this.header = header;
}

Request.prototype = {
  constructor: Request,
  setURL(url) {
    this.url = url;
  },
  setPath(path) {
    this.path = path;
  },
};

const request = {
  createRequest: (domain, path, method, header) => new Request(domain, path, method, header),
};

export default request;
