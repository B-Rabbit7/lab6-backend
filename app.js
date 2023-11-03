const http = require('http');
const url = require('url');
const PORT = process.env.PORT || 8888;
const GET = 'GET';
const POST = 'POST';
const dictionary = {};
const search_route = '/search/';
const create_route = '/create';
const endpoint_error = 'Endpoint not found'
const method_error = 'Method not allowed'
const exists_error = "Warning, item already exists"
let count = 0;
let request = 0;

http.createServer(function (req, res) {
    const {
        pathname,
        query
    } = url.parse(req.url, true);
    if (req.method === GET) {
        if (pathname === search_route) {
            const term = query.term;
            request += 1;
            if (term in dictionary) {
                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*"
                });
                const reply = `${term}: ${dictionary[term]}`;
                res.end(JSON.stringify({
                    result: reply
                }));
            } else {
                res.writeHead(404, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*"
                });
                const reply = `Request # ${request}, word ${term} not found!`;
                res.end(JSON.stringify({
                    error: reply
                }));
            }
        } else {
            res.writeHead(404, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*"
            });
            res.end(JSON.stringify({
                error: endpoint_error
            }));
        }
    } else if (req.method === POST) {
        if (pathname === create_route) {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // convert buffer to string
            });

            req.on('end', () => {
                const data = JSON.parse(body);
                if (data.term in dictionary) {
                    res.writeHead(400, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "*"
                    });
                    res.end(JSON.stringify({
                        error: exists_error
                    }));
                } else {
                    dictionary[data.term] = data.definition;
                    count += 1;
                    res.writeHead(201, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "*"
                    });
                    const reply = `Request # ${count}\nNew entry recorded:\n"${data.term} : ${data.definition}"`;
                    res.end(JSON.stringify({
                        result: reply
                    }));
                }
            });
        } else {
            res.writeHead(404, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*"
            });
            res.end(JSON.stringify({
                error: endpoint_error
            }));
        }
    } else {
        res.writeHead(405, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*"
        });
        res.end(JSON.stringify({
            error: method_error
        }));
    }
}).listen(PORT);