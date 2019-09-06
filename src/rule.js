// {
//   "url": "http://www.shopback.com/some/resource?q=1",
//   "method": "POST",
//   "headers": {
//     "Cookie": "name=value; name2=value2; name3=value3",
//     "Content-Type": "application/json",
//     "X-SHOPBACK-AGENT": "anything"
//   }
// }

function Request(url, method, header) {
  this.url = url;
  this.method = method;
  this.header = header;
}

Request.prototype = {
  constructor: Request,
  setURL(url) {
    this.url = url;
  },
};

const request = {
  createRequest: (url, method, header) => new Request(url, method, header),
};

export default request;
