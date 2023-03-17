const events = require('events');
const net = require('net');
const clientWorker = require('./clientWorker.js');

const port = 9070;
const host = '127.0.0.1';
const brokerName = 'OWAP Broker - reference impl.';

const server = net.createServer();
server.listen(port, host, () => {
    console.log('OWAP Broker running on port ' + port + '.');
});


let clients = [];

server.on('connection', function(sock) {
    var client = new clientWorker(sock);
    clients.push(client);

    console.log('Clients: ' + clients.length);

    client.sendServerHelo(brokerName);
   
    client.eventEmitter.on('eventSent', (frame, client) => {
        clients.map((cli) => {
            if(cli != client) {
                if(cli.topics) {
                    if(cli.topics.has(frame.topic)) {
                        cli.sendFrame(frame);
                    }
                }
            }
        });
    });

    client.eventEmitter.on('clientTimeout', (clientName, client) => {
        clients.map((cli) => {
            if(cli != client) {
                if(cli.topics) {
                    if(cli.topics.has("system")) {
                        cli.sendClientTimeoutFrame(brokerName, clientName);
                    }
                }
            }
        });
    });

    client.eventEmitter.on('closed', (client) => {
        let index = clients.findIndex((item) => { return item == client; });
        if (index !== -1) clients.splice(index, 1);       
        
        console.log('Client ' + client.name + ' closed.');
        console.log('Clients: ' + clients.length);
    });
});