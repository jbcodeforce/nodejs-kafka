export class Item {
    productID: string;
    quantity: number;
}
export class Order {
    orderID: string;
    items: Item[];
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