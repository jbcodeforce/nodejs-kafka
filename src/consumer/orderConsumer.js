const kafka = require('kafka-node');

var args = process.argv.slice(2);
var partitionId = parseInt(args[0]);
const topicName = 'orders';
// const topicName = 'bluewaterShip';

console.log("#####################################");
console.log("# Consumer event from " + topicName);
console.log(" on partition: " + partitionId);

const client = new kafka.KafkaClient({
    kafkaHost: 'localhost:9092',
    clientId: "order-client2",
    connectTimeout: 10000, // in ms it takes to wait for a successful connection before moving to the next host 
    requestTimeout: 25000,
    autoConnect: true, // automatically connect when KafkaClient is instantiated
    idleConnection: 6000, // allows the broker to disconnect an idle connection from a client 5 min default.
    maxAsyncRequests: 10 // maximum async operations at a time toward the kafka cluster
});


var offset = new kafka.Offset(client);
offset.fetch([{ topic: topicName, partition: 0, time: -1 }], function (err, data) {
    var latestOffset = data[topicName]['0'][0];
    console.log("Consumer current offset: " + latestOffset);
});

var consumer = new kafka.Consumer(client,
    [{ topic: topicName,
        offset: 0,
     partition: 0
    }],
    {
        groupId: 'group-ship',//consumer group id
        autoCommit: false,
        autoCommitIntervalMs: 5000, 
        // The max wait time is the maximum amount of time in milliseconds to block waiting if insufficient data is available at the time the request is issued, default 100ms
        fetchMaxWaitMs: 1000, 
        // This is the minimum number of bytes of messages that must be available to give a response, default 1 byte
        fetchMinBytes: 1,    
        // The maximum bytes to include in the message set for this partition. This helps bound the size of the response.
        fetchMaxBytes: 1024 * 1024, 
        // If set true, consumer will fetch message from the given offset in the payloads
        fromOffset: true,
        //autoOffsetReset: 'earliest',
        // If set to 'buffer', values will be returned as raw buffer objects.
        encoding: 'utf8',
        keyEncoding: 'utf8'
    },{
        
    }
    );

    // By default, we will consume messages from the last committed offset of the current group
consumer.on('message', function (message) {
    // TODO aggregate total number of command per product
    // in case to use buffer: var buf = new Buffer(message.value, "binary"); 
    var decodedOrder = JSON.parse(message.value.toString());
    console.log(message.value.toString());
   });

consumer.on("error", function(err) {
    console.log("error", err);
});

process.on("SIGINT", function() {
    consumer.close(true, function() {
        process.exit();
    });
});