# Nodejs Kafka consumers and producers

In this example I want to illustrate the [event sourcing](#event-sourcing-pattern) pattern using kafka, nodejs and expressjs. One code will be used as producer, other as consumers, assigned to a Kafka consumer group to match the number of partition allocated to the order-topic. 

## Pre-requisite
* [Here are my notes on Kafka](https://github.com/ibm-cloud-architecture/refarch-eda/tree/master/docs/kafka) 
* Have a kafka broker with zookeeper running somewhere: can be Event Streams on IBM Cloud, or using the `docker compose` file as defined in [this project](https://github.com/ibm-cloud-architecture/refarch-kc/tree/master/docker), or use a kubernetes deployment with multiple brokers. 
* Create the dependant topic with the command:
```
docker exec -ti docker_kafka1_1  /bin/bash -c "kafka-topics --create  --zookeeper zookeeper1:2181 --replication-factor 1 --partitions 20 --topic orders-topic"
```

## Event sourcing pattern

[Introduced by Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html) event sourcing is a pattern to store application state updates as a immutable sequence of ordered events. Using Kafka as event log we can reconstruct past states. 
The key to Event Sourcing is that we guarantee that all changes to the domain objects are initiated by the event objects. This means we can do a complete rebuild of the application by parsing the event log. Using the event timestamp we can do temporal query to assess the state of the application at a given point of time. 

Event sourcing enables to add application in the future that needs to process the same older events to do their business logic. 

Event sourcing brings complexity and fit to purpose needs to be assessed. One very good reason is the need for audit log. It is the base for two other patterns: parallel models and retroactive events.

Event log in the context of Kafka is the topic, and all application logic event handler are done in topic subscribers.

## Solution outline

* one nodejs producer (orderProducer.js) of Order events to the order-topic. The program arguments are used to specify the number of orders to send. It uses the kafka nodejs module.
* Order has a customer id referencing which shop orders the product. It includes the order number, a status, a total amount, a total quantity, the product referenced and the expected delivery date. 
* one consumer that can be scaled horizontally and that is part of a consumer group
* Use CQRS to implement getting the history of an order. The filter may apply to a specific product

## Developing the solution

Here are the steps followed to build the solution:
* create a app.js for the producer. Parse the argument to get the number of order to send, create a kafka client and a producer. Loop to produce the n orders. Important that the payload to send is an array. The topic needs to exist. Be sure the producer is ready, so use the `ready` event and callback function to send the events. The message is a string from a JSON Order.  Here is an example of callback on producer 'ready' state event.

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
The response to the producer.send() operation is a json document with the topic name, the partition id and the latest offset within the partition: The topic has 20 partitions, and the first 4 partitions are on offset 6.

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

For the consumer part, the code is under `consumer/orderConsumer.js`. It also creates a Kafka client with the hostname and port number for the brokers to connect to. The tricky part is on the consumer instantiation. As the topic was created with 20 partitions, the consumer needs to specify which partition to consume from, and it also needs to specify the offset to read from. If no offset is defined it reads from the last commited offset.
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
Consumer groups are grouping consumers to cooperate to consume messages from one or more topics. Organized in cluster the coordinator servers are responsible for assigning partitions to the consumers in the group. The rebalancing of partition to consumer is done when a new consumer join or leave the group or when a new partition is added to an existing topic.

Event sourcing helps to do the following use cases:
* Complete Rebuild: We can discard the application state completely and rebuild it by re-running the events from the event log on an empty application. In kafka it will be done by setting the offset to 0 and the `fromOffset` option to true.
* 

### Get order history

Get the order history for a given customer id, the current page, and possible filters to apply to the results. The clear separation between query and creation or update operations helps to offload the order services with complex implementation that needs a lot of CPU to execute. 
Using the API composition pattern to retrieve data scattered across multiple services results in expensive, inefficient in-memory joins. The service that owns the data stores the data in a form or in a database that doesn’t efficiently support the required query.
CQRS is about clear separation of concerns and splits a persistent data model and the modules that use it into two parts: the command side and the query side. The query side keeps its data model synchronized with the command-side data model by subscribing to the events published by the command side. The command part is still supporting simple queries with non-join, and using primary key. It is responsible to publish events on data changes.

## References

* [Kafka nodejs API](https://www.npmjs.com/package/kafka-node)
* [Consumer design and implementation considerations](https://github.com/ibm-cloud-architecture/refarch-eda/tree/master/docs/kafka/consumer.md)
* [IBM Event Streams consuming messages](https://ibm.github.io/event-streams/about/consuming-messages/)