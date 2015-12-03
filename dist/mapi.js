// Copyright 2015 The Home Depot
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var http = require("http");
var fs = require("fs");
var URL = require("url");
var pjson = require("pjson");
var jsonplus_1 = require("jsonplus");
// Colors updates the String object
require("colors");
var Mapi = (function () {
    function Mapi(args) {
        // Get args
        var dbFile = args[0], port = args[1] ? Number(args[1]) : 9000, hostname = args[2] || "localhost";
        if (dbFile) {
            this.map = jsonplus_1.parse(this.readFile(args[0]));
        }
        else {
            this.usage("Please provide a DB");
            return this.exit(1);
        }
        console.log("%s %s", "Mock server started".green, ("http://" + hostname + ":" + port + "/_mapi/").magenta.underline);
        this.createServer(port, hostname);
    }
    /**
     * Exits application with given status
     */
    Mapi.prototype.exit = function (status) {
        return process.exit(status);
    };
    /**
     * Creates a server
     */
    Mapi.prototype.createServer = function (port, hostname) {
        http.createServer(this.server.bind(this)).listen(port, hostname);
    };
    /**
     * Prints the usage information
     */
    Mapi.prototype.usage = function (errorMessage) {
        if (errorMessage === void 0) { errorMessage = ""; }
        console.log(errorMessage.red);
        console.log("Usage:".green.underline);
        console.log("  mapi db.json".yellow, " # Just point a file as database".grey);
        console.log("  mapi db.json 8080".yellow, " # You can set a port as well".grey);
        console.log("  mapi db.json 8080 127.0.0.1".yellow, " # You can set a hostname as well".grey);
        console.log("Version: %s".green, pjson.version);
        console.log("More details on %s".green, pjson.homepage);
    };
    /**
     * Reads the given file and returns it as a string
     */
    Mapi.prototype.readFile = function (fileName) {
        var file;
        try {
            file = fs.readFileSync(fileName, { encoding: "utf-8" });
        }
        catch (e) {
            this.usage("Could not read " + fileName);
            return this.exit(1);
        }
        return file;
    };
    /**
     * Send a response to the request with given content and status code
     */
    Mapi.prototype.sendResponse = function (ServerResponse, content, status) {
        if (status === void 0) { status = 200; }
        ServerResponse.writeHead(status, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        ServerResponse.end(content);
        return ServerResponse;
    };
    Mapi.prototype.serveStatic = function (ServerResponse, filename, mimeType) {
        var stats, fileStream;
        try {
            stats = fs.lstatSync(filename); // throws if path doesn't exist
        }
        catch (e) {
            ServerResponse.writeHead(404, { "Content-Type": "text/plain" });
            ServerResponse.write("404 Not Found\n");
            ServerResponse.end();
            return ServerResponse;
        }
        if (stats.isFile()) {
            // path exists, is a file
            ServerResponse.writeHead(200, { "Content-Type": mimeType });
            fileStream = fs.createReadStream(filename);
            fileStream.pipe(ServerResponse);
        }
        return ServerResponse;
    };
    /**
     * Writes an entry to server logs
     */
    Mapi.prototype.log = function (status, url, message) {
        if (message === void 0) { message = ""; }
        console.log("- %s %s, %s", 
        // Pick color for the status code
        ("[ " + status + " ]")[status === 200 ? "green" : "red"], url.yellow, message.grey);
        return message;
    };
    Mapi.prototype.searchMapRegExp = function (url) {
        var _this = this;
        // Determines whether url should be treated as a regular expression
        var rgxToken = ":", 
        //let isRgxUrl = this.endsWith(url.noTrailing, rgxToken);
        // Get all the keys to look for wildcards
        // TODO: Find all these keys during initialization and cache the results
        urls = Object.keys(this.map), entry;
        // Going through all endpoints, create a regexp from wildcards and
        // try to match them to URL provided.
        urls.forEach(function (endpoint) {
            // Detect regex
            if (endpoint.indexOf(":") === 0) {
                // Remove the rgxToken from the current endpoint
                endpoint = endpoint.slice(1, endpoint.length);
                // Create a REGEXP from the current endpoint
                var rgx = new RegExp(endpoint, "gim");
                if (rgx.test(url.noTrailing) || rgx.test(url.trailing)) {
                    entry = _this.map[rgxToken + endpoint];
                }
            }
            else if (endpoint.indexOf("*") !== -1) {
                // First sanitize all possible REGEXP signs
                var sanitized = endpoint.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
                // Then find sanitized * and replace it with URL ready wildcard
                var rgx = new RegExp(sanitized.replace(/\\\*/g, "([^\\/]*?)"), "gim");
                // Try url with regexp, make sure to test
                // with trailing slash as well.
                if (rgx.test(url.noTrailing) || rgx.test(url.trailing)) {
                    entry = _this.map[endpoint];
                }
            }
        });
        return entry;
    };
    /**
     * Searches request URL in the endpoint map with given method. Returns information found.
     */
    Mapi.prototype.searchMap = function (url, method) {
        if (method === void 0) { method = "GET"; }
        var entry, result = {};
        entry = this.map[url.noTrailing] || this.map[url.trailing] || this.searchMapRegExp(url);
        // If url is not in the map
        if (entry === undefined) {
            result.notFound = true;
        }
        else {
            result = { url: url.original };
            // Make sure data exists
            if (entry[method]) {
                result.fixture = entry[method].response;
                result.status = entry[method].status || 200;
            }
            else if (entry.ALL) {
                result.fixture = entry.ALL.response;
                result.status = entry.ALL.status || 200;
            }
            else {
                result.notFound = true;
            }
        }
        // Return the found response
        return result;
    };
    /**
     * Normalizes the url but creating trailing and non trailing slash
     * versions of it. it also contains the original url
     */
    Mapi.prototype.normalizeUrl = function (url) {
        var cleaned;
        var result = { original: url };
        var parsed;
        cleaned = url.replace(/\/+/g, "/").replace("/mapi", "/api");
        parsed = URL.parse(cleaned);
        if (/\/$/.test(parsed.pathname)) {
            result.trailing = URL.format(parsed);
            parsed.pathname = parsed.pathname.replace(/\/$/, "");
            result.noTrailing = URL.format(parsed);
        }
        else {
            result.noTrailing = URL.format(parsed);
            parsed.pathname = parsed.pathname + "/";
            result.trailing = URL.format(parsed);
        }
        return result;
    };
    /**
     * Handles the requests and sends response back accordingly.
     */
    Mapi.prototype.server = function (ServerRequest, ServerResponse) {
        var response, status, logMessage, endpoint, 
        // Add trailing slash no matter what
        // replace /mapi with /api so that you can define your endpoints as /api but still
        // use them as / By this way you can have real api and mock api at the same time
        reqUrl = this.normalizeUrl(ServerRequest.url);
        endpoint = this.searchMap(reqUrl, ServerRequest.method);
        if (endpoint.notFound !== true) {
            // if url found in the endpoint map, display the
            // fixture data with status code
            response = JSON.stringify(endpoint.fixture);
            status = endpoint.status;
            logMessage = endpoint.url;
        }
        else if (reqUrl.noTrailing === "/favicon.ico") {
            // Serve this file statically
            return this.serveStatic(ServerResponse, "src/images/favicon.ico", "image/x-icon");
        }
        else if (reqUrl.noTrailing === "/_mapi") {
            // for this url, display all mocked API Endpoints
            response = JSON.stringify(Object.keys(this.map));
            status = 200;
            logMessage = "show all urls";
        }
        else {
            if (this.map.default404) {
                response = this.map.default404.ALL.response;
                status = this.map.default404.ALL.status;
                logMessage = "default 404";
            }
            else {
                // If URL was not found display 404 message
                response = "{ \"error\": \"Could not find " + reqUrl.original + "\" }";
                status = 404;
                logMessage = "url not mapped";
            }
        }
        this.log(status, reqUrl.original, logMessage);
        this.sendResponse(ServerResponse, response, status);
    };
    return Mapi;
})();
exports.Mapi = Mapi;
