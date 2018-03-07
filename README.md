# open-traffic-lights-publisher

Publishes events of resources (e.g. sensors, traffic lights) with Server-Sent Events (SSE) and HTTP/2.
# Install

## SSL

Create your key and certificate with following command and place them in the `keys` folder:
```
openssl req -new -newkey rsa:2048 -nodes -out server.csr -keyout server.key
```

## Input data

If you have a process (`data_proc`) that generates linked data to STDOUT, you can pipe it to
the publisher as follows:
```
data_proc | node index.js
```

## Publish/subscribe

A client can subscribe to a resource by supplying its URI into the `uri` parameter, e.g.:

```
var source1 = new EventSource('https://localhost:3000?uri=' + 'http://data.observer.be/sensor/1');
source1.onmessage = function(e) {
  document.body.innerHTML += e.data + '<br>';
};
```

Data gets pushed to these endpoints by using the `http://www.w3.org/1999/02/22-rdf-syntax-ns#about` property of the named graph in the input stream.

## Test

TODO





