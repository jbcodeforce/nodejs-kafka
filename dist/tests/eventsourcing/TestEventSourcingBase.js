"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Play n events on the order and verify the consumer has persisted the data.
 */
const domain = require("../../model/OrderDomain");
const OrderProducer_1 = require("../../producer/OrderProducer");
const OrderConsumer_1 = require("../../consumer/OrderConsumer");
function createTestOrder() {
    let order = new domain.Order();
    order.creationDate = new Date();
    order.expectedDeliveryDate = "03/15/2019";
    order.orderID = "order001";
    order.items = [];
    let item = new domain.Item();
    item.productID = "product 01";
    item.quantity = 10;
    order.items.push(item);
    return order;
}
exports.default = createTestOrder;
/**
* Self executing anonymous function using TS as a main
*/
(() => {
    const topicName = 'orders';
    console.log("###################################");
    console.log("# Start Order Consumer ");
    console.log("###################################");
    let consumer = new OrderConsumer_1.default();
    consumer.startConsumer();
    console.log("###################################");
    console.log("# Produce orders to " + topicName);
    console.log("###################################");
    let order = createTestOrder();
    console.log(JSON.stringify(order));
    let producer = new OrderProducer_1.default();
    producer.createOrder(order);
})();
//# sourceMappingURL=TestEventSourcingBase.js.map