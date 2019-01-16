export class Order {
    orderID: string;
    productID: string;
    quantity: number;
    expectedDeliveryDate: string;
    status: string;
    creationDate: Date;
}

export class OrderEvent {
    orderID: string;
    order: Order;
    timestamp: Date;
    type: string;
}