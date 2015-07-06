///<reference path='definitions/node.d.ts'/>
///<reference path='definitions/colors.d.ts'/>
///<reference path='definitions/mapi.d.ts'/>
///<reference path='definitions/pjson.d.ts'/>
var http = require("http");
var fs = require("fs");
var pjson = require("pjson");
require("colors");
var Mapi = (function () {
    function Mapi(args) {
        var dbFile = args[0];
        var port = args[1] ? Number(args[1]) : 9000;
        var hostname = args[2] || 'localhost';
        if (dbFile) {
            this.map = JSON.parse(this.readFile(args[0]));
        }
        else {
            this.usage('Please provide a DB');
        }
        console.log('%s %s', 'Mock server started'.green, ("http://" + hostname + ":" + port + "/_mapi/").magenta.underline);
        http.createServer(this.server.bind(this)).listen(port, hostname);
    }
    Mapi.prototype.usage = function (errorMessage) {
        if (errorMessage === void 0) { errorMessage = ''; }
        console.log(errorMessage.red);
        console.log("Usage:".green.underline);
        console.log("  mapi db.json".yellow, " # Just point a file as database".grey);
        console.log("  mapi db.json 8080".yellow, " # You can set a port as well".grey);
        console.log("  mapi db.json 8080 127.0.0.1".yellow, " # You can set a hostname as well".grey);
        console.log("Version: %s".green, pjson.version);
        console.log("More details on %s".green, pjson.homepage);
        process.exit(1);
    };
    Mapi.prototype.readFile = function (fileName) {
        var file;
        try {
            file = fs.readFileSync(fileName, { encoding: 'utf-8' });
        }
        catch (e) {
            this.usage("Could not read " + fileName);
        }
        return file;
    };
    Mapi.prototype.sendResponse = function (ServerResponse, content, status) {
        if (status === void 0) { status = 200; }
        ServerResponse.writeHead(status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        ServerResponse.end(content);
        return ServerResponse;
    };
    Mapi.prototype.log = function (status, url, message) {
        if (message === void 0) { message = ''; }
        console.log('- %s %s, %s', ("[ " + status + " ]")[status === 200 ? 'green' : 'red'], url.yellow, message.grey);
        return message;
    };
    Mapi.prototype.searchMap = function (url, method) {
        if (method === void 0) { method = 'GET'; }
        var entry, rgx, found = false, sanitized, urls;
        if (!this.map[url]) {
            url = url.replace(/\/$/, '');
            if (!this.map[url]) {
                urls = Object.keys(this.map);
                urls.forEach(function (endpoint) {
                    if (endpoint.indexOf('*') !== -1) {
                        sanitized = endpoint.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
                        rgx = new RegExp(sanitized.replace(/\\\*/g, '([^\\/]*?)'), 'gim');
                        if (rgx.test(url) || rgx.test(url + '/')) {
                            url = endpoint;
                            found = true;
                        }
                    }
                });
                if (found === false) {
                    return {
                        notFound: true
                    };
                }
            }
        }
        entry = this.map[url];
        return {
            url: url,
            fixture: entry[method].response,
            status: Number(entry[method].status || 200)
        };
    };
    Mapi.prototype.server = function (ServerRequest, ServerResponse) {
        var response, status, logMessage, endpoint, reqUrl = (ServerRequest.url + '/').replace(/\/+/g, '/').replace('/mapi', '/api');
        endpoint = this.searchMap(reqUrl, ServerRequest.method);
        if (endpoint.notFound !== true) {
            response = JSON.stringify(endpoint.fixture);
            status = endpoint.status;
            logMessage = endpoint.url;
        }
        else if (reqUrl === '/_mapi/') {
            response = JSON.stringify(Object.keys(this.map));
            status = 200;
            logMessage = 'show all urls';
        }
        else {
            response = "{ \"error\": \"Could not find " + reqUrl + "\" }";
            status = 404;
            logMessage = 'url not mapped';
        }
        this.log(status, reqUrl, logMessage);
        this.sendResponse(ServerResponse, response, status);
    };
    return Mapi;
})();
new Mapi(process.argv.slice(2));
