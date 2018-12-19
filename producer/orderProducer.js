/*
* Create n order to send to the topic. Use gaussian to prepare product and quantity
*/
const kafka = require('kafka-node');
const utils = require('./util');

var Producer = kafka.Producer;

var args = process.argv.slice(2);
var numberOfOrders = args[0];

console.log("###################################");
console.log("# Producer orders to orders-topic #");
console.log(" # of orders " + numberOfOrders);


// client keep connection with the brokers
const client = new kafka.KafkaClient({
    kafkaHost: 'localhost:9092',
    connectTimeout: 10000, // in ms it takes to wait for a successful connection before moving to the next host 
    requestTimeout: 25000,
    autoConnect: true, // automatically connect when KafkaClient is instantiated
    idleConnection: 60000, // allows the broker to disconnect an idle connection from a client 5 min default.
    maxAsyncRequests: 10 // maximum async operations at a time toward the kafka cluster
});

var producer = new Producer(client,{
    requireAcks: 1,    // Configuration for when to consider a message as acknowledged, default 1
    ackTimeoutMs: 100, // The amount of time in milliseconds to wait for all acks before considered, default 100ms
    partitionerType: 2 // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 0
});
var products = utils.generateProducts(50);

var cb= function(err,data) {
   console.log(data)
}

// For this demo we just log producer errors to the console.
producer.on("error", function(error) {
    console.error(error);
});
 

// Before sending message wait for producer to be ready
producer.on("ready", function(){
    for (var i=0; i < numberOfOrders; i++) {
        var pid = Math.round(utils.generateGaussianNoise(0,products.length,2));
        var q = Math.round(utils.generateGaussianNoise(0,5000,3));
        console.log(pid+ " " + q);
        var order = {id: i, company: "retailer-1", productId: products[pid], quantity: q , unitPrice: 5,   timestamp: Date.now() };
        var orderAsString = JSON.stringify(order);
        console.log('Send order '+ orderAsString);
        const buffer = new Buffer.from(orderAsString);
        const produceRequest = [{
            topic: "orders-topic",
            messages: buffer,
            attributes: 0 // control message compression: 0: no compression ,1: GZip, 2: snappy
        }];
        producer.send(produceRequest,cb);
    }
});


process.on("SIGINT", function() {
    producer.close(true, function() {
        process.exit();
    });
});





