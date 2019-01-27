/**
 * Play n events on the order and verify the consumer has persisted the data.
 */
import * as domain from '../../model/OrderDomain';
import OrderProducer from '../../producer/OrderProducer';
import OrderConsumer from '../../consumer/OrderConsumer';


export default function createTestOrder(): domain.Order {
    let order: domain.Order = new domain.Order();
    order.creationDate = new Date();
    order.expectedDeliveryDate = "03/15/2019";
    order.orderID = "order001";
    order.items = [];
    let item: domain.Item = new domain.Item();
    item.productID = "product 01";
    item.quantity = 10;
    order.items.push(item);
    return order;
}
 /**
* Self executing anonymous function using TS as a main
*/
(()=> {
    const topicName = 'orders';
    console.log("###################################");
    console.log("# Start Order Consumer ");
    console.log("###################################");
    let consumer = new OrderConsumer();
    consumer.startConsumer();

    console.log("###################################");
    console.log("# Produce orders to " + topicName);
    console.log("###################################");
    let order = createTestOrder();
    console.log(JSON.stringify(order));
    let producer = new OrderProducer();
    producer.createOrder(order);
})();
