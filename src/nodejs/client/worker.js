const { clearInterval } = require('timers');
const events = require('events');
const net = require('net');

const protocolFactory = require('../lib/protocolFactory.js');

const USE_KEEPALIVE = true;

/**
 * worker
 */
class worker {

    /**
     * 
     * @param {*} socket 
     */
    constructor(socket) {
        this.socket = socket;
        this.eventEmitter = new events.EventEmitter();
        this.readBuffer = "";
        this.lastSeen = Date.now();
        this.name = "OWAP_CLIENT_" + Math.floor(Math.random() * 200);

        console.log("Connected to broker as " + this.name);

        // timeout and heartbeat
        if(USE_KEEPALIVE) {
            this.keepAliveTimer = setInterval((socket) => {
                let hb = protocolFactory.makeHeartbeat();
                this.sendFrame(hb);
            }, 2000, socket);

            this.timeoutTimer = setInterval((socket) => {
                if( (Date.now() - this.lastSeen) > 5000) {
                    if(this.socket) {
                        console.log('Broker timeout!');
                        
                        if(this.name)
                            this.eventEmitter.emit('brokerTimeout', this.name, this);

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
                console.log('Receive buffer too big ' + socket.remoteAddress + ': ' + data);
                
                this.closeSocket();
            }
        });

        // handle socket close
        this.socket.on('close', () => {
            this.closeSocket();
        }, this);

        // simulate fake events for testing
        this.simTimer = setInterval((socket) => {
            let frame = protocolFactory.makeEventFrame();
            frame.topic = "positioning";
            frame.eventType = "POS_UPDATE"
            frame.X = Math.random() * 180.0;
            frame.Y = Math.random() * 90.0;
            this.sendFrame(frame);
        }, 3000, socket);
    }

    /**
     * 
     */
    parseFrame(data) {
        try {
            let frame = JSON.parse(data);

            if(frame && frame.type) {
                if(frame.type == "HELO") {
                    console.log("Received HELO from broker " + frame.brokerName);

                    let reply = protocolFactory.makeClientHelo(this.name, ["positioning"]);
                    this.sendFrame(reply);
                }

                if(frame.type == "EVENT") {
                    console.log('Received event: ' + JSON.stringify(frame));
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
        clearInterval(this.simTimer);

        if(this.socket) {
            this.socket.destroy();
        }

        this.eventEmitter.emit('closed', this);
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
}

module.exports = worker;