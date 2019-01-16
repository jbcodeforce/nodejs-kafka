/*
* This is a simple component to set configuation from environment variables or config file
*/

const config = require('./config.json');

export default class AppConfig {
    constructor() {}
    public getKafkaBrokers(): string {
        return process.env.KAFKA_BROKERS || config.kafkaBrokers;
    }

    public getKafkaConnectTimeout(): number {
       return config.kafkaConnectTimeout;
    }

    public getKafkaGroupId(): string {
        return config.kafkaGroupId;
    }

    public getOrderTopicName(): string {
        return process.env.ORDER_TOPIC || config.orderTopicName;
    }
 
}