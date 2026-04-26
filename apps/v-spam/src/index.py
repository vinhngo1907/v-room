from infrastructure.config import getConfig
from spam_module.spam_service import SpamService
from infrastructure.kafka import getKafkaConsumer, getKafkaProducer
import os
# import six
# import sys
# if sys.version_info >= (3, 12, 0):
#     sys.modules['kafka.vendor.six.moves'] = six.moves


# def main():
#     config = getConfig()
#     consumer = getKafkaConsumer(config)
#     producer = getKafkaProducer(config)
#     spam_service = SpamService()

#     print("spam-service started")

#     for message in consumer:
#         try:
#             if not message.value.get("message"):
#                 continue
#             is_spam = spam_service.is_spam(message.value.get("message"))
#             if is_spam:
#                 response = {
#                     "id": message.value.get("id"),
#                     "user_id": message.value.get("user_id"),
#                     "analysis": {"spam": True},
#                 }
#                 producer.send(config["KAFKA_ANALYSIS_MESSAGE_TOPIC"], response)

#         except Exception as error:
#             print("error", error)


# if __name__ == "__main__":
#     main()

def main():
    config = getConfig()
    consumer = getKafkaConsumer(config)
    producer = getKafkaProducer(config)
    spam_service = SpamService()

    print('spam-service started')

    for message in consumer:
        try:
            if not message.value.get('message'):
                continue

            is_spam = spam_service.is_spam(message.value.get('message'))
            if is_spam:
                response = {
                    'id': message.value.get('id'),
                    'user_id': message.value.get('user_id'),
                    'analysis': {
                        'spam': True
                    }
                }
                producer.send(config['KAFKA_ANALYSIS_MESSAGE_TOPIC'], response)

        except Exception as error:
            print('error', error)


if __name__ == '__main__':
    main()