# open-traffic-lights-publisher

Publishes events of resources (e.g. sensors, traffic lights) with Server-Sent Events (SSE) and HTTP/2.
# Install

## SSL

Create your key and certificate with following command and place them in the `keys` folder:
```
openssl req -new -newkey rsa:2048 -nodes -out server.csr -keyout server.key
```

## Input data

If you have a process (`data_proc`) that generates JSON-LD graphs to STDOUT, you can pipe it to
the publisher as follows:
```
data_proc | node index.js
```

An event can look like this:
```
{
	"@context": {
		"generatedAt": {
			"@id": "http://www.w3.org/ns/prov#generatedAtTime",
			"@type": "http://www.w3.org/2001/XMLSchema#date"
		},
		"sensor": "http://example.org/sensor",
    "status": "http://example.org/status",
		"crossRoad": "http://example.org/crossRoad",
		"about": "http://www.w3.org/1999/02/22-rdf-syntax-ns#about"
	},
	"@id": "http://example.org/observations?time=2018-03-07T16:57:08",
	"generatedAt": "2018-03-07T16:57:08+01:00",
	"@type": ["http://www.w3.org/ns/prov#Bundle", "http://www.w3.org/ns/prov#Entity"],
	"about": "http://data.observer.be/sensor/1",
	"@graph": [{
		"@id": "http://example.org/light/1",
		"@type": "TrafficLight",
		"status": "http://example.org/status#green"
	}, {
		"@id": "http://example.org/light/2",
		"@type": "TrafficLight",
		"status": "http://example.org/status#red"
	}]
}
```

## Publish/subscribe

A client can subscribe to a resource by supplying its URI into the `uri` parameter, e.g.:

```
var source1 = new EventSource('https://localhost:3000?uri=' + 'http://data.observer.be/sensor/1');
source1.onmessage = function(e) {
  document.body.innerHTML += e.data + '<br>';
};
```

Data gets pushed to these endpoints by using the `http://www.w3.org/1999/02/22-rdf-syntax-ns#about` property of the named graph (JSON-LD) in the input stream.

## Test

TODO





