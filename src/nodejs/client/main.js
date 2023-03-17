const net = require('net');
const worker = require('./worker.js');

const port = 9070;
const host = '127.0.0.1';

const socket = new net.Socket();
socket.connect(port, host, function() {
	var client = new worker(socket);
});