import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerConfig } from 'src/types';

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
}
