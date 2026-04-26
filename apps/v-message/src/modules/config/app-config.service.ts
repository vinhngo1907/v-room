import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig, SwaggerConfig } from 'src/types';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.get('APP_PORT') || 3003;
  }
  get mongoUrl(): string {
    return (
      this.configService.get('MONGO_URI') ||
      'mongodb://micro_user:micro_pwd@localhost:27017/micro_messages'
    );
  }

  get swaggerConfig(): SwaggerConfig {
    return {
      user: this.configService.get<string>('DOC_USER'),
      pass: this.configService.get<string>('DOC_PASS'),
    };
  }

  get kafkaConfig(): KafkaConfig & {
    analysisGroupId: string;
    consumerGroupId: string;
    rawMessTopic: string;
    analysisMessTopic: string;
  } {
    return {
      uri: this.configService.get<string>('KAFKA_URI'),
      analysisGroupId: this.configService.get<string>(
        'KAFKA_ANALYSIS_MESSAGE_GROUP',
      ),
      consumerGroupId: this.configService.get<string>(
        'KAFKA_RAW_MESSAGE_GROUP',
      ),
      rawMessTopic: this.configService.get<string>('KAFKA_RAW_MESSAGE_TOPIC'),
      analysisMessTopic: this.configService.get<string>(
        'KAFKA_ANALYSIS_MESSAGE_TOPIC',
      ),
    };
  }
}
