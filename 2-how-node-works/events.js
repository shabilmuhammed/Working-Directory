const EventEmitter = require('events');
const http = require('http');

class Sales extends EventEmitter {
  constructor() {
    super();
  }
}

const myEventEmitter = new Sales();
myEventEmitter.on('newSale', () => {
  console.log('There was a new sale!');
});

myEventEmitter.on('newSale', () => {
  console.log('Consumer Name: Shashi');
});

myEventEmitter.on('newSale', (stock) => {
  console.log(`There are now ${stock} items left in stock`);
});

myEventEmitter.emit('newSale', 9); // Generates an event. Like clicking on a button

//////////////////////////////

const server = http.createServer();

server.on('request', (req, res) => {
  console.log('Request received!');
  res.end('Reqeuest received');
});

server.on('request', (req, res) => {
  console.log('Request received!');
});

server.on('close', () => {
  console.log('Server closed');
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
});
