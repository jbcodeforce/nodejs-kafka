"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kafka = require('kafka-node');
const Producer = kafka.Producer;
// externalize the configuration
const AppConfig_1 = require("../config/AppConfig");
const domain = require("../model/OrderDomain");
class OrderProducer {
    constructor() {
        this.producerReady = false;
        this.config = new AppConfig_1.default();
        this.buildProducer();
    }
    buildProducer() {
        // client keep connection with the brokers
        const client = new kafka.KafkaClient({
            kafkaHost: this.config.getKafkaBrokers(),
            connectTimeout: this.config.getKafkaConnectTimeout(),
            requestTimeout: 25000,
            autoConnect: true,
            idleConnection: 60000,
            maxAsyncRequests: 10 // maximum async operations at a time toward the kafka cluster
        });
        this.producer = new Producer(client, {
            requireAcks: 1,
            ackTimeoutMs: 100,
            partitionerType: 2 // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 0
        });
        this.producer.on("error", function (error) {
            console.error(error);
        });
        console.log("Producer started");
        this.producer.on("ready", function () {
            console.log("Producer is ready");
            this.producerReady = true;
        });
    }
    createOrder(o) {
        if (this.producerReady) {
            console.log('Create Order event for : ' + JSON.stringify(o));
            let event = new domain.OrderEvent();
            event.order = o;
            event.orderID = o.orderID;
            event.timestamp = new Date();
            // call persistence
            event.type = "OrderCreated";
            let evtAsString = JSON.stringify(event);
            console.log(" send order event " + evtAsString);
            let payload = [{
                    topic: this.config.getOrderTopicName(),
                    message: [evtAsString]
                }];
            this.producer.send(payload);
            return o;
        }
    }
}
exports.default = OrderProducer;
//# sourceMappingURL=OrderProducer.js.map