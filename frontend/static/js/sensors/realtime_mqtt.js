// static/js/sensors/realtime_mqtt.js

export class SensorRealtimeMQTT {
    constructor(brokerUrl, topic) {
        this.client = mqtt.connect(brokerUrl);
        this.topic = topic;

        this.client.on("connect", () => {
            console.log("MQTT connected.");
            this.client.subscribe(topic);
        });

        this.client.on("message", (topic, msg) => {
            console.log("MQTT data:", topic, msg.toString());
        });
    }
}
