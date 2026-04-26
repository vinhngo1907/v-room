import json, ssl
from kafka import KafkaConsumer
from kafka import KafkaProducer
import os

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
        # api_version=(0, 10),
        auto_offset_reset='earliest',
        security_protocol="SSL",
        ssl_context=ssl_context,
        consumer_timeout_ms=10000,
        group_id=config["KAFKA_READY_MESSAGE_GROUP"],
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
