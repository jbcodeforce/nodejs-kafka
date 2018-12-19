# Nodejs Kafka consumers and producers

In this example I want to illustrate the [event sourcing](#event-sourcing-pattern) pattern using kafka, nodejs and expressjs. One code will be used as producer, other as consumers, assigned to a Kafka consumer group to match the number of partition allocated to the test-topic. 

## Pre-requisite
* [Here are my notes](https://github.com/ibm-cloud-architecture/refarch-eda/tree/master/docs/kafka) on Kafka
* Have a kafka broker with zookeeper running somewhere: can be Event Streams on IBM Cloud, or using the docker compose file as defined in [this project](https://github.com/ibm-cloud-architecture/refarch-kc/tree/master/docker) or use a kubernetes deployment with multiple brokers. 
* Create the dependant topic with:
```
docker exec -ti docker_kafka1_1  /bin/bash -c "kafka-topics --create  --zookeeper zookeeper1:2181 --replication-factor 1 --partitions 20 --topic orders-topic"
```

## Event sourcing pattern

[Introduced by Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html) event sourcing is a pattern to store application state updates as a sequence of events. Using Kafka as event log we can reconstruct past states. 
The key to Event Sourcing is that we guarantee that all changes to the domain objects are initiated by the event objects.

## Solution outline

* one nodejs producer of Order event to a order-topic
* one consumer that can be scaled horizontally and that is part of a consumer group

## Developing the solution

Here are the steps followed to build the solution:
* create a app.js for the producer. Parse the argument to get the number of order to send, create a kafka client and a producer. Loop to produce the n orders. Important that the payload to send is an array. The topic needs to exists. Be sure the producer is ready, so use the `ready` event and callback function to send the events. The message is a string from a JSON Order.

```js
producer.on("ready", function(){
    for (var i=0; i < numberOfOrder; i++) {
        var order = {id: i, company: "retailer-1", productId: "p1", quantity: 3000, unitPrice: 5,   timestamp: Date.now() };
        var orderAsString = JSON.stringify(order);
        const buffer = new Buffer.from(orderAsString);
        const produceRequest = [{
            topic: "orders-topic",
            messages: buffer,
            attributes: 0 
        }];
        producer.send(produceRequest,cb);
    }
});
```
The response to the send() operation is a json with the topic name, the partition id and the latest offset within the partition: The topic has 20 partitions, and the first 4 partitions are on offset 6.

```
{ 'orders-topic': { '15': 0 } }
{ 'orders-topic': { '16': 0 } }
{ 'orders-topic': { '17': 0 } }
{ 'orders-topic': { '18': 0 } }
{ 'orders-topic': { '19': 0 } }
{ 'orders-topic': { '0': 6 } }
{ 'orders-topic': { '1': 6 } }
{ 'orders-topic': { '2': 6 } }
{ 'orders-topic': { '3': 6 } }
{ 'orders-topic': { '4': 5 } }
{ 'orders-topic': { '5': 1 } }
```

For the consumer part, the code is under consumer/orderConsumer.js. It also creates a Kafka client with the hostname and port number for the brokers to connect to. The tricky part is on the consumer instantiation. As the topic was created with 20 partitions, the consumer needs to specify which partition to consume from, and it also needs to specify the offset to read from. If no offset is defined it reads from the last commited offset.
You’ll generally want multiple consumer instances, one for each partition of a topic.  
Consumers are expected to run indefinitely. 

```js
var consumer = new Consumer(client,
    [{ topic: 'orders-topic',
     offset: 0, 
     partition: partitionId
    }],{  groupId: 'order-consumer-group',
      autoCommit: true,
      fromOffset: true,});
consumer.on('message', function (message) {
    var decodedOrder = JSON.parse(message.value.toString());
    console.log(decodedOrder.productId + " " + decodedOrder.quantity);
}
```

If the offset and partitions are not specified, the groupId is used and the broker will assign the topic-partition to the new consumer. So a pure dynamic allocation has the following options:

```js
var consumer = new Consumer(client,
    [{ topic: 'orders-topic'},
     { groupId: 'order-consumer-group',
      autoCommit: true,
      fromOffset: false}
    ]);
```


Event sourcing helps to do the following use cases:
* Complete Rebuild: We can discard the application state completely and rebuild it by re-running the events from the event log on an empty application. In kafka it will be done by setting the offset to 0 and the `fromOffset` option to true.
* 


## References

* [Kafka nodejs API](https://www.npmjs.com/package/kafka-node)
* [Consumer design and implementation considerations](https://github.com/ibm-cloud-architecture/refarch-eda/tree/master/docs/kafka/consumer.md)