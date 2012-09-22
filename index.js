var DuplexStream = require('duplex-pipe');
var inherits = require('inherits');

var resMethods = [
    'write', 'end', 'flush',
    'writeHeader', 'writeHead', 'writeContinue',
    'setHeader', 'getHeader', 'removeHeader', 'addTrailers',
];
var resEvents = [ 'error', 'drain' ];

var reqMethods = [
    'pause', 'resume', 'setEncoding'
];
var reqProps = [
    'client', 'complete', 'connection',
    'headers', 'httpVersion', 'httpVersionMajor', 'httpVersionMinor',
    'method', 'readable', 'socket', 'trailers', 'upgrade', 'url',
];
var reqEvents = [ 'data', 'end', 'error', 'close' ];

function HttpDuplex (req, res) {
    DuplexStream.call(this);
    
    var self = this;
    self.request = req;
    self.response = res;
    
    reqEvents.forEach(function (name) {
        var emit = self.emit.bind(self, name);
        req.on(name, function () {
            emit.apply(null, arguments);
        });
    });
    
    resEvents.forEach(function (name) {
        var emit = self.emit.bind(self, name);
        res.on(name, function () {
            emit.apply(null, arguments);
        });
    });
    
    Object.defineProperty(self, 'statusCode', {
        get : function () { return res.statusCode },
        set : function (code) { res.statusCode = code },
        enumerable : true
    });
    
    reqProps.forEach(function (name) {
        Object.defineProperty(self, name, {
            get : function () { return req[name] },
            enumerable : true
        });
    });
    
    Object.defineProperty(self, 'writable', {
        get : function () { return res.writable },
        enumerable : true
    });
}

inherits(HttpDuplex, DuplexStream);

reqMethods.forEach(function (name) {
    HttpDuplex.prototype[name] = function () {
        return this.request[name].apply(this.request, arguments);
    };
});

resMethods.forEach(function (name) {
    HttpDuplex.prototype[name] = function () {
        return this.response[name].apply(this.response, arguments);
    };
});

HttpDuplex.prototype.destroy = function () {
    this.request.destroy();
    this.response.destroy();
};

module.exports = function (req, res) {
    return new HttpDuplex(req, res);
};
