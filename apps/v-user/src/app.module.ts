import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
// import { UsersRepoModule } from 'src/modules/users-repo/users.repo.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersRepoModule } from './modules/users-repo/users-repo.module';
import { AppConfigModule } from './modules/config/app-config.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: [
				// __dirname + '/../config/.env.prod',
				'config/.env',
			],
			isGlobal: true,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get<string>('MONGO_URI'),
			}),
		}),
		UsersRepoModule,
		UsersModule,
		AppConfigModule
	],
})
export class AppModule { }
