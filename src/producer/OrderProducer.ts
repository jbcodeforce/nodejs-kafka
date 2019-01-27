const kafka = require('kafka-node');
const Producer = kafka.Producer;
// externalize the configuration
import AppConfig  from '../config/AppConfig';
import * as domain from '../model/OrderDomain';

export default class OrderProducer {
    config: AppConfig;
    producer: any;
    producerReady: boolean = false;

    constructor() {
        this.config =  new AppConfig();
        this.buildProducer();
    }

    public buildProducer() {
        // client keep connection with the brokers
        const client = new kafka.KafkaClient({
            kafkaHost: this.config.getKafkaBrokers(),
            connectTimeout: this.config.getKafkaConnectTimeout(), // in ms it takes to wait for a successful connection before moving to the next host 
            requestTimeout: 25000,
            autoConnect: true, // automatically connect when KafkaClient is instantiated
            idleConnection: 60000, // allows the broker to disconnect an idle connection from a client 5 min default.
            maxAsyncRequests: 10 // maximum async operations at a time toward the kafka cluster
        });
        this.producer = new Producer(client,{
            requireAcks: 1,    // Configuration for when to consider a message as acknowledged, default 1
            ackTimeoutMs: 100, // The amount of time in milliseconds to wait for all acks before considered, default 100ms
            partitionerType: 2 // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 0
        });
        this.producer.on("error", function(error) {
            console.error(error);
        });
        console.log("Producer started");
        this.producer.on("ready", function(){
            console.log("Producer is ready");
            this.producerReady = true;
        });
        
    }

    createOrder(o: domain.Order): domain.Order {
        if (this.producerReady) {
            console.log('Create Order event for : ' + JSON.stringify(o));
            let event: domain.OrderEvent = new domain.OrderEvent();
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
            this.producer.send(payload,)
            return o;
        }
       
    }
    
}

