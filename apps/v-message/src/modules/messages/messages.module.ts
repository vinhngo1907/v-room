import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { KafkaController } from './kafka.controller';
import { ConfigService } from '@nestjs/config';
import { MessagesRepoModule } from '../messages-repo/messages-repo.module';
import { AppConfigService } from 'src/modules/config/app-config.service';

@Module({
  imports: [MessagesRepoModule],
  controllers: [MessagesController, KafkaController],
  providers: [MessagesService, ConfigService, AppConfigService],
  exports: [MessagesService],
})
export class MessagesModule {}
