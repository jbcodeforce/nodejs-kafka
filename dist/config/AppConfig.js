"use strict";
/*
* This is a simple component to set configuation from environment variables or config file
*/
Object.defineProperty(exports, "__esModule", { value: true });
const config = require('./config.json');
class AppConfig {
    constructor() { }
    getKafkaBrokers() {
        return process.env.KAFKA_BROKERS || config.kafkaBrokers;
    }
    getKafkaConnectTimeout() {
        return config.kafkaConnectTimeout;
    }
    getKafkaGroupId() {
        return config.kafkaGroupId;
    }
    getOrderTopicName() {
        return process.env.ORDER_TOPIC || config.orderTopicName;
    }
}
exports.default = AppConfig;
//# sourceMappingURL=AppConfig.js.map