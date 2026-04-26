import json
from kafka import KafkaConsumer
from kafka import KafkaProducer
import ssl

def getKafkaConsumer(config):
    ssl_context = ssl.create_default_context(
        cafile=config['KAFKA_CA']
    )

    ssl_context.load_cert_chain(
        certfile=config["KAFKA_CERT"],
        keyfile=config["KAFKA_KEY"]
    )
    return KafkaConsumer(
        config["KAFKA_READY_MESSAGE_TOPIC"],
        bootstrap_servers=[config["KAFKA_URI"]],
        # api_version=(0,10),
        auto_offset_reset='earliest',
        group_id=config["KAFKA_READY_MESSAGE_GROUP"],
        security_protocol='SSL',
        ssl_context=ssl_context,
        consumer_timeout_ms=10000,
        # sasl_mechanism=config["KAFKA_MECHANISM"],
        # sasl_plain_username=config["KAFKA_USER"],  # Kafka username
        # sasl_plain_password=config["KAFKA_PASS"],  # Kafka password
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )


def getKafkaProducer(config):
    ssl_context = ssl.create_default_context(
        cafile=config['KAFKA_CA']
    )

    ssl_context.load_cert_chain(
        certfile=config["KAFKA_CERT"],
        keyfile=config["KAFKA_KEY"]
    )
    return KafkaProducer(
        bootstrap_servers=[config["KAFKA_URI"]],
        security_protocol="SSL",
        ssl_context=ssl_context,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )