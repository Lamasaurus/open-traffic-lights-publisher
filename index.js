const http2 = require('http2');
const fs = require('fs');
var EventEmitter = require('events').EventEmitter;
const querystring = require('querystring');

var emitter = new EventEmitter();

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

  // Fetch uri by its query parameter
  var resource = querystring.parse(req.headers[':path'])['uri'] || querystring.parse(req.headers[':path'])['/?uri'];

  // Only add once a listener for a resource
 if (listeners[resource] == null) {
   listeners[resource] = [];
    emitter.on(resource, function (data) {
      for (var i = 0; i < listeners[resource].length; i++) {
        listeners[resource][i].write('data:'+ data + '\n\n');
      }
    });
  }

  // Add the response object to retrieve updates for this resource
  listeners[resource].push(res);

  // Remove the response object when disconnecting
  req.on("close", function() { 
    listeners[resource].pop(res);
  });  // <- Remove this client when he disconnects
}