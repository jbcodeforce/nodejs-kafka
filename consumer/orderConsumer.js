const kafka = require('kafka-node');
const Consumer = kafka.Consumer;

var args = process.argv.slice(2);
var partitionId = parseInt(args[0]);
console.log("#####################################");
console.log("# Consumer orders from orders-topic #");
console.log(" on partition: " + partitionId);

const client = new kafka.KafkaClient({
    kafkaHost: 'localhost:9092',
    connectTimeout: 10000, // in ms it takes to wait for a successful connection before moving to the next host 
    requestTimeout: 25000,
    autoConnect: true, // automatically connect when KafkaClient is instantiated
    idleConnection: 60000, // allows the broker to disconnect an idle connection from a client 5 min default.
    maxAsyncRequests: 10 // maximum async operations at a time toward the kafka cluster
});

var consumer = new Consumer(client,
    [{ topic: 'orders-topic',
    // offset: 0, 
     // partition: partitionId
    }],
    {
        groupId: 'order-consumer-group',//consumer group id
        autoCommit: true,
        autoCommitIntervalMs: 5000, 
        // The max wait time is the maximum amount of time in milliseconds to block waiting if insufficient data is available at the time the request is issued, default 100ms
        fetchMaxWaitMs: 100, 
        // This is the minimum number of bytes of messages that must be available to give a response, default 1 byte
        fetchMinBytes: 1,    
        // The maximum bytes to include in the message set for this partition. This helps bound the size of the response.
        fetchMaxBytes: 1024 * 1024, 
        // If set true, consumer will fetch message from the given offset in the payloads
        fromOffset: false,
        // If set to 'buffer', values will be returned as raw buffer objects.
        encoding: 'utf8',
        keyEncoding: 'utf8'
    }
    );

    // By default, we will consume messages from the last committed offset of the current group
consumer.on('message', function (message) {
    console.log(message);
    // TODO aggregate total number of command per product
    // in case to use buffer: var buf = new Buffer(message.value, "binary"); 
    var decodedOrder = JSON.parse(message.value.toString());
    console.log(decodedOrder.productId + " " + decodedOrder.quantity);
});

consumer.on("error", function(err) {
    console.log("error", err);
});

process.on("SIGINT", function() {
    consumer.close(true, function() {
        process.exit();
    });
});