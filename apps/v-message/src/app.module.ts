import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesModule } from './modules/messages/messages.module';
import { MessagesRepoModule } from './modules/messages-repo/messages-repo.module';
// import { join } from 'path';
import { AppConfigService } from 'src/modules/config/app-config.service';
import { AppConfigModule } from 'src/modules/config/app-module';

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => {
        return { uri: configService.mongoUrl };
      },
    }),
    MessagesModule,
    MessagesRepoModule,
  ],
  controllers: [],
  providers: [ConfigService],
})
export class AppModule {}
