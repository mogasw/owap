const PROTOCOL_VERSION = '1.0';

let protocolFactory = {
    
    /**
     * makeFrameHeader
     * @param {*} messageType 
     * @param {*} payload 
     * @returns 
     */
    makeFrameHeader: function(messageType, flags) {
        let frame = {};
        frame.type = messageType;
        frame.ts = Date.now();
        if(flags) {
            frame.flags = flags;
        }

        return frame;
    },

    /**
     * makeHeartbeat
     * @returns 
     */
    makeHeartbeat: function() {
        let hb = this.makeFrameHeader('HB');
        return hb;
    },

    /**
     * makeServerHelo
     * @param {*} brokerName 
     * @returns 
     */
    makeServerHelo: function(brokerName) {
        let frame = this.makeFrameHeader('HELO');
        frame.protocolVersion = PROTOCOL_VERSION;
        frame.brokerName = brokerName;

        return frame;
    },

    /**
     * makeClientHelo
     * @param {*} clientName 
     * @param {*} topics 
     */
    makeClientHelo: function(clientName, topics) {
        let frame = this.makeFrameHeader('CLIHELO');
        frame.protocolVersion = PROTOCOL_VERSION;
        frame.clientName = clientName;
        if(topics) {
            frame.topics = topics;
        }

        return frame;
    },

    /**
     * makeClientHeloAck
     * @param {*} clientName 
     * @param {*} topics 
     * @returns 
     */
    makeClientHeloAck: function(version, topics) {
        let frame = this.makeFrameHeader('CLIHELO_ACK');
        frame.protocolVersion = version;
        if(topics) {
            frame.topics = topics;
        }

        return frame;
    },

    /**
     * 
     * @param {*} topic 
     */
    makeSubscribeFrame: function(topic) {
        let frame = this.makeFrameHeader('SUB');
        frame.topic = topic;
        return frame;
    },

    /**
     * makeUnsubscribeFrame
     * @param {*} topic 
     * @returns 
     */
    makeUnsubscribeFrame: function(topic) {
        let frame = this.makeFrameHeader('UNSUB');
        frame.topic = topic;
        return frame;
    },

    /**
     * makeEventFrame
     * @param {*} clientName 
     * @param {*} eventType 
     * @param {*} topic 
     * @returns 
     */
    makeEventFrame: function(clientName, eventType, topic) {
        let frame = this.makeFrameHeader('EVENT');
        frame.eventType = eventType;
        frame.topic = topic;
        if(clientName) {
            frame.sender = clientName;
        }
        return frame;
    },

    /**
     * makeClientTimeoutFrame
     * @param {*} clientName 
     */
    makeClientTimeoutFrame: function(brokerName, clientName) {
        let frame = this.makeEventFrame(brokerName, 'APP_TIMEOUT', 'system');
        frame.clientName = clientName;
        return frame;
    },
}

module.exports = protocolFactory;