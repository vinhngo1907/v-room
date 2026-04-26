import {
  Controller,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';
import { MessagesService } from './messages.service';
import { messageAnalysisDto, MessageWebDto } from '@libs/v-dto';
import { AppConfigService } from 'src/modules/config/app-config.service';
@Controller()
export class KafkaController implements OnModuleInit, OnModuleDestroy {
  constructor(
    private configService: ConfigService,
    private appConfigService: AppConfigService,
    private messagesService: MessagesService,
  ) {}

  private readonly logger = new Logger(KafkaController.name);

  private readonly kafka: Kafka = new Kafka({
    clientId: 'user_service',
    // brokers: [this.configService.get<string>('KAFKA_URI')],
    brokers: [this.appConfigService.kafkaConfig.uri],
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('config/keys/ca.pem', 'utf-8'),
      key: fs.readFileSync('config/keys/service.key', 'utf-8'),
      cert: fs.readFileSync('config/keys/service.cert', 'utf-8'),
    },
    // sasl: {
    //   mechanism: this.configService.get<string>('KAFKA_MECHANISM'),
    //   username: this.configService.get<string>('KAFKA_USER'),
    //   password: this.configService.get<string>('KAFKA_PASS'),
    // } as any,
  });

  private readonly producer: Producer = this.kafka.producer();

  private readonly consumer: Consumer = this.kafka.consumer({
    // groupId: this.configService.get<string>('KAFKA_RAW_MESSAGE_GROUP'),
    groupId: this.appConfigService.kafkaConfig.consumerGroupId,
  });

  private readonly analysisConsumer: Consumer = this.kafka.consumer({
    // groupId: this.configService.get<string>('KAFKA_ANALYSIS_MESSAGE_GROUP'),
    groupId: this.appConfigService.kafkaConfig.analysisGroupId,
  });

  async onModuleInit() {
    try {
      await this.producer.connect();

      await this.consumer.connect();

      await this.consumer.subscribe({
        // topic: this.configService.get<string>('KAFKA_RAW_MESSAGE_TOPIC'),
        topic: this.appConfigService.kafkaConfig.rawMessTopic,
        fromBeginning: true,
      });

      await this.analysisConsumer.subscribe({
        // topic: this.configService.get<string>('KAFKA_ANALYSIS_MESSAGE_TOPIC'),
        topic: this.appConfigService.kafkaConfig.analysisMessTopic,
        fromBeginning: true,
      });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log('KAFKA_RAW_MESSAGE_TOPIC', { topic, partition, message });
          this.receiveMessage(message);
        },
      });

      await this.analysisConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.receiveAnalysis(message);
        },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      await this.analysisConsumer.disconnect();
    } catch (error) {
      this.logger.error(error);
    }
  }

  async receiveAnalysis(params: KafkaMessage) {
    try {
      const messageValue: { user_id: string; analysis: messageAnalysisDto } =
        JSON.parse(params.value.toString());
      const { user_id: id, analysis } = messageValue;
      await this.messagesService.receiveAnalysis({ id, analysis });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async receiveMessage(params: KafkaMessage) {
    try {
      const messageValue = JSON.parse(params.value.toString());
      console.log('TEST MESS VALUE', { messageValue });
      const { uuid, message, room_id, user_id, created_at } = messageValue;
      const readyMessage: MessageWebDto =
        await this.messagesService.receiveMessage({
          uuid,
          message,
          room_id,
          user_id,
          created_at,
        });

      await this.producer.send({
        topic: this.configService.get<string>('KAFKA_READY_MESSAGE_TOPIC'),
        messages: [
          {
            key: room_id,
            value: JSON.stringify(readyMessage),
          },
        ],
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
