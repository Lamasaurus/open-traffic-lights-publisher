const http2 = require('http2');
const fs = require('fs');
var EventEmitter = require('events').EventEmitter;
const querystring = require('querystring');

var emitter = new EventEmitter();

var clientId = 0;
var clients = {}; // <- Keep a map of attached clients
var listeners = {}; // <- Keep a map of attached clients per resource

const server = http2.createSecureServer({
  key: fs.readFileSync('./keys/server.key'),
  cert: fs.readFileSync('./keys/server.crt')
}, onRequest);
server.on('error', (err) => console.error(err));

server.listen(3000);

// Read from JSON-LD named graph from standard input
// About property contains URI of the resource the named graph is about
process.stdin.on('data', function (data) {
  if (data != null) {
    var received =  JSON.parse(data);
    emitter.emit(received.about, received);
  }
});

// Request handler
function onRequest (req, res) {
 // set content type for SSE stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');

  var resource = querystring.parse(req.headers[':path'])['uri'] || querystring.parse(req.headers[':path'])['/?uri'];
  if (!listeners[resource]) listeners[resource] = [];


   (function(clientId) {
            clients[clientId] = res;  // <- Add this client to those we consider "attached"
            listeners[resource].push(clientId);
            req.on("close", function(){delete clients[clientId]; listeners[resource].pop(clientId)});  // <- Remove this client when he disconnects
    })(++clientId)

  // The resource the client wishes to retrieve events from
  emitter.on(resource, function (data) {
    for (var i = 0; i < listeners[resource].length; i++) {
         clients[listeners[resource]].write('data:'+ data + '\n\n');       
    }
  });
}