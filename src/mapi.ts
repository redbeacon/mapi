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

///<reference path='definitions/node.d.ts'/>
///<reference path='definitions/colors.d.ts'/>
///<reference path='definitions/mapi.d.ts'/>
///<reference path='definitions/pjson.d.ts'/>

import "colors";
import http = require("http");
import fs = require("fs");
import pjson = require("pjson");

export class Mapi {
    map:mapi.EndpointMap

    /**
     * @constructor
     */
    constructor(args:string[]) {
        // Get args
        var dbFile = args[0];
        var port = args[1]? Number(args[1]) : 9000;
        var hostname = args[2] || 'localhost';

        if (dbFile) {
            this.map = JSON.parse(this.readFile(args[0]));
        } else {
            this.usage('Please provide a DB');
            return this.exit(1);
        }

        console.log('%s %s',
            'Mock server started'.green,
            `http://${hostname}:${port}/_mapi/`.magenta.underline
        );

        this.createServer(port, hostname);
    }

    /**
     * Exits application with given status
     */
    exit(status:number): any {
        return process.exit(status);
    }

    /**
     * Creates a server
     */
    createServer(port:number, hostname:string) {
        http.createServer(this.server.bind(this)).listen(port, hostname)
    }

    /**
     * Prints the usage information
     */
    usage(errorMessage:string = ''): any {
        console.log(errorMessage.red);
        console.log("Usage:".green.underline);
        console.log("  mapi db.json".yellow, " # Just point a file as database".grey);
        console.log("  mapi db.json 8080".yellow, " # You can set a port as well".grey);
        console.log("  mapi db.json 8080 127.0.0.1".yellow, " # You can set a hostname as well".grey);
        console.log("Version: %s".green, pjson.version);
        console.log("More details on %s".green, pjson.homepage);
    }

    /**
     * Reads the gicen file and returns it as a string
     */
    readFile(fileName:string): string {
        var file;
        try {
            file = fs.readFileSync(fileName, { encoding: 'utf-8' });
        } catch (e) {
            this.usage(`Could not read ${fileName}`);
            return this.exit(1);
        }
        return file;
    }

    /**
     * Send a response to the request with given content and status code
     */
    sendResponse(ServerResponse:http.ServerResponse, content:string, status:number = 200): http.ServerResponse {

        ServerResponse.writeHead(status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });

        ServerResponse.end(content);

        return ServerResponse;
    }

    serveStatic(ServerResponse:http.ServerResponse, filename:string, mimeType:string): http.ServerResponse {
        var stats, fileStream;

        try {
            stats = fs.lstatSync(filename); // throws if path doesn't exist
        } catch (e) {
            ServerResponse.writeHead(404, { 'Content-Type': 'text/plain' });
            ServerResponse.write('404 Not Found\n');
            ServerResponse.end();
            return;
        }

        if (stats.isFile()) {
            // path exists, is a file
            ServerResponse.writeHead(200, { 'Content-Type': mimeType } );
            fileStream = fs.createReadStream(filename);
            fileStream.pipe(ServerResponse);
        }

        return ServerResponse;
    }

    /**
     * Writes an entry to server logs
     */
    log(status:number, url:string, message:string = ''): string {
        console.log('- %s %s, %s',
                	// Pick color for the status code
                    (`[ ${status} ]`)[status === 200 ? 'green' : 'red'],
                    url.yellow,
                    message.grey);
        return message;
    }

    /**
     * Searches request URL in the enpoint map with given method. Returns information found.
     */
    searchMap(url:string, method:string = 'GET'): mapi.MapSearchResult {
        var entry,
            rgx:RegExp,
            found = false,
            sanitized:string,
            urls:Array<string>;

        // If url is not in the map
        if (!this.map[url]) {
            // then remove the slash
            url = url.replace(/\/$/, '');

            // If there was no direct hit, look for wildcards
            if (!this.map[url]) {
                // Get all the keys to look for wildcards
                // TODO: Find all these keys during initialization and cache the results
                urls = Object.keys(this.map);

                // Going through all endpoints, create a regexp from wildcards and
                // try to match them to URL provided.
                urls.forEach((endpoint) => {

                    // We have only one wild card
                    if (endpoint.indexOf('*') !== -1) {

                        // First sanitize all possible REGEXP signs
                        sanitized = endpoint.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

                        // Then find sanitized * and replace it with URL ready wildcard
                        rgx = new RegExp(sanitized.replace(/\\\*/g, '([^\\/]*?)'), 'gim');

                        // Try url with regexp, make sure to test
                        // with trailing slash as well.
                        if (rgx.test(url) || rgx.test(url + '/')) {
                            url = endpoint;
                            found = true;
                        }
                    }
                });

                // Even regexp search did not find anything
                if (found === false) {
                    return {
                        notFound: true
                    };
                }
            }
        }

        // Matching url found. Return it in specified format
        entry = this.map[url];

        return {
            url: url,
            fixture: entry[method].response,
            status: Number(entry[method].status || 200)
        };
    }

    /**
     * Handles the requests and sends response back accordingly.
     */
    server(ServerRequest:http.ServerRequest, ServerResponse:http.ServerResponse) {
        var response: string,
            status: number,
            logMessage: string,
            endpoint: mapi.MapSearchResult,
            // Add trailing slash no matter what
            // replace /mapi with /api so that you can define your enpoints as /api but still
            // use them as /mapi. By this way you can have real api and mock api at the same time
            reqUrl:string = (ServerRequest.url + '/').replace(/\/+/g, '/').replace('/mapi', '/api');

        endpoint = this.searchMap(reqUrl, ServerRequest.method);

        if (endpoint.notFound !== true) {
            // if url found in the endpoint map, display the
            // fixture data with status code
            response = JSON.stringify(endpoint.fixture);
            status = endpoint.status;
            logMessage = endpoint.url;

        } else if (reqUrl === '/favicon.ico/') {
            // Serve this file staticly
            return this.serveStatic(ServerResponse, 'src/images/favicon.ico', 'image/x-icon');
        } else if (reqUrl === '/_mapi/') {
            // for this url, display all mocked API Endpoints
            response = JSON.stringify(Object.keys(this.map));
            status = 200;
            logMessage = 'show all urls';
        } else {
            // If URL was not found display 404 message
            response = `{ "error": "Could not find ${reqUrl}" }`;
            status = 404;
            logMessage = 'url not mapped';
        }

        this.log(status, reqUrl, logMessage);
        this.sendResponse(ServerResponse, response, status);
    }
}