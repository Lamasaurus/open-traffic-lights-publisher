const http2 = require('http2');
const fs = require('fs');
var EventEmitter = require('events').EventEmitter;
const querystring = require('querystring');
var catalog = {
  "@context":{
      "generatedAt": {
        "@id": "http://www.w3.org/ns/prov#generatedAtTime",
        "@type": "http://www.w3.org/2001/XMLSchema#date"
      },
      "TrafficLight": "http://example.org/TrafficLight",
      "longitude": "http://www.w3.org/2003/01/geo/wgs84_pos#long",
      "latitude": "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
      "catalog": "https://www.w3.org/ns/dcat#Catalog",
      "streamEndpoint": "http://w3id.org/rsp/vocals#StreamEndpoint"
  },
  "@type": ["http://www.w3.org/ns/prov#Entity", "catalog"],

  "@graph":[]
};

const positions = [[51.219115, 4.420655], [51.218839, 4.421601]];

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
    var received = JSON.parse(data);
    addToCatalogue(received);
    emitter.emit(received.about, JSON.stringify(received));
  }
});

function addToCatalogue(sensor){
  for (var s of catalog["@graph"])
    if (s["@id"] == sensor.about)
      return;

  var number = Number(sensor.about.split("/").pop()) - 1;

  catalog["@graph"].push({
    "@id": sensor.about,
    "@type": ["http://www.w3.org/ns/prov#Entity", "http://w3id.org/rsp/vocals#RDFStream"],
    "streamEndpoint" : sensor.about,
    "latitude": positions[number][0],
    "longitude": positions[number][1]
  });
}

// Request handler
function onRequest (req, res) {
 // set content type for SSE stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Fetch uri by its query parameter
  var resource = querystring.parse(req.headers[':path'])['uri'] || querystring.parse(req.headers[':path'])['/?uri'];

  if(resource){
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
  }else{
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(JSON.stringify(catalog));
  }
}