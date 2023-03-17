const { clearInterval } = require('timers');
const events = require('events');
const net = require('net');

const protocolFactory = require('../lib/protocolFactory.js');

const USE_KEEPALIVE = true;

/**
 * clientWorker
 */
class clientWorker {

    /**
     * 
     * @param {*} socket 
     */
    constructor(socket) {
        this.socket = socket;
        this.eventEmitter = new events.EventEmitter();
        this.readBuffer = "";
        this.lastSeen = Date.now();

        this.topics = new Set();
        this.name = "";

        console.log('CONNECTED: ' + this.socket.remoteAddress + ':' + this.socket.remotePort);

        // timeout and heartbeat
        if(USE_KEEPALIVE) {
            this.keepAliveTimer = setInterval((socket) => {
                let hb = protocolFactory.makeHeartbeat();
                this.sendFrame(hb);
            }, 2000, socket);

            this.timeoutTimer = setInterval((socket) => {
                if( (Date.now() - this.lastSeen) > 5000) {
                    if(this.socket) {
                        console.log('Client timeout: ' +  this.socket.remoteAddress + ':' + this.socket.remotePort);
                        
                        if(this.name)
                            this.eventEmitter.emit('clientTimeout', this.name, this);

                        this.closeSocket();
                    }
                }
            }, 5000, this);

            this.socket.on('data', () => {this.lastSeen = Date.now()}, this);
        }

        // parse received data
        this.socket.on('data', (data) => {
            this.readBuffer = this.readBuffer + data;

            let frameEndIdx = this.readBuffer.indexOf("}\r\n");
            while(frameEndIdx != -1) {
                const data = this.readBuffer.slice(0, frameEndIdx + 1);
                
                this.parseFrame(data);

                // update the read buffer
                this.readBuffer = this.readBuffer.slice(frameEndIdx + 1);
                frameEndIdx = this.readBuffer.indexOf("}\r\n");
            }

            if(this.readBuffer.length > 16384) {
                console.log('Receiver buffer too big ' + socket.remoteAddress + ': ' + data);
                
                this.closeSocket();
            }
        });

        this.socket.on('close', () => {
            this.closeSocket();
        }, this);
    }

    /**
     * 
     */
    parseFrame(data) {
        try {
            let frame = JSON.parse(data);

            if(frame && frame.type) {
                if(frame.type == "CLIHELO") {
                    if(frame.clientName) {
                        this.name = frame.clientName;
                    }
                    if(frame.topics) {
                        frame.topics.map((topic) => {
                            this.topics.add(topic);
                        }, this);
                    }

                    let reply = protocolFactory.makeClientHeloAck(frame.protocolVersion, Array.from(this.topics));
                    this.sendFrame(reply);

                    console.log('Client ' + this.name + ' sent helo');
                    if(this.topics) {
                        console.log('Client ' + this.name + ' subscribed to topics: ' + Array.from(this.topics).join(',') );
                    }
                }

                if(frame.type == "SUB") {
                    if(frame.topic) {
                        this.topics.add(frame.topic);

                        frame.type = "SUB_ACK";
                        frame.ts = Date.now();
                        this.sendFrame(frame);

                        console.log('Client ' + this.name + ' subscribed topic ' + frame.topic);
                    }
                }

                if(frame.type == "UNSUB") {
                    if(frame.topic) {
                        this.topics.delete(frame.topic);

                        frame.type = "UNSUB_ACK";
                        frame.ts = Date.now();
                        this.sendFrame(frame);

                        console.log('Client ' + this.name + ' unsubscribed topic ' + frame.topic);
                    }
                }

                if(frame.type == "EVENT") {

                    // add the sender name to this frame before broadcasting it
                    frame.sender = this.name;
                    
                    this.eventEmitter.emit('eventSent', frame, this);

                    console.log('Client ' + this.name + ' sent event ' + frame.eventType);
                }
            }
        } catch (e) {            
            console.log('Received corrupted data from ' + this.socket.remoteAddress + ': ' + data);

            this.closeSocket();
        }
    }

    /**
     * 
     */
    closeSocket() {
        this.readBuffer = "";
        clearInterval(this.keepAliveTimer);
        clearInterval(this.timeoutTimer);

        if(this.socket) {
            this.socket.destroy();
        }

        this.eventEmitter.emit('closed', this);
    }

    /**
     * 
     * @param {*} brokerName 
     */
    sendServerHelo(brokerName) {
        if(this.socket) {
            let frame = protocolFactory.makeServerHelo(brokerName);
            this.sendFrame(frame);
        }
    }

    /**
     * 
     * @param {*} frame 
     */
    sendFrame(frame) {
        if(this.socket) {
            this.socket.write(JSON.stringify(frame)+"\r\n");
        }
    }

    /**
     * 
     * @param {*} brokerName 
     * @param {*} clientName 
     */
    sendClientTimeoutFrame(brokerName, clientName) {
        if(this.socket) {
            let frame = protocolFactory.makeClientTimeoutFrame(brokerName, clientName);
            this.sendFrame(frame);
        }
    }
}

module.exports = clientWorker;