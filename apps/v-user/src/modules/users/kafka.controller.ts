import { Controller, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Producer, Consumer, KafkaMessage } from "kafkajs";
import { UsersService } from "./users.service";
import { messageAnalysisDto } from "@libs/v-dto";
import { AppConfigService } from "../config/app-config.service";
@Controller()
export class KafkaController implements OnModuleInit, OnModuleDestroy {
	constructor(
		private configService: ConfigService,
		private usersService: UsersService,
		private readonly appConfig: AppConfigService
	) { }

	private readonly logger = new Logger(KafkaController.name);

	private readonly kafka: Kafka = new Kafka({
		clientId: 'user_service',
		// brokers: [this.configService.get<string>('KAFKA_URI')],
		brokers: [this.appConfig.kafkaConfig.host],
		sasl: {
			rejectUnauthorized: true,
			// mechanism: this.configService.get<string>('KAFKA_MECHANISM'),
			// username: this.configService.get<string>('KAFKA_USER'),
			// password: this.configService.get<string>('KAFKA_PASS'),
			mechanism: this.appConfig.kafkaConfig.mechanism,
			username: this.appConfig.kafkaConfig.user,
			password: this.appConfig.kafkaConfig.password
		} as any,
	});

	private readonly analysisConsumer: Consumer = this.kafka.consumer({
		// groupId: this.configService.get<string>('KAFKA_ANALYSIS_MESSAGE_GROUP'),
		groupId: this.appConfig.kafkaConfig.analysis_mess_group
	});

	async onModuleInit() {
		try {
			await this.analysisConsumer.subscribe({
				// topic: this.configService.get<string>('KAFKA_ANALYSIS_MESSAGE_TOPIC'),
				topic: this.appConfig.kafkaConfig.analysis_mess_topic,
				fromBeginning: true,
			});
			await this.analysisConsumer.run({
				eachMessage: async ({ topic, partition, message }) => {
					this.receiveAnalysis(message)
				}
			})
		} catch (error: any) {
			this.logger.error(error);
		}
	}

	async onModuleDestroy() {
		try {
			await this.analysisConsumer.disconnect();
		} catch (error: any) {
			this.logger.error(error);
		}
	}

	async receiveAnalysis(params: KafkaMessage) {
		try {
			const messageValue: {
				user_id: string,
				analysis: messageAnalysisDto
			} = JSON.parse(params.value.toString());

			const { user_id: id, analysis } = messageValue;

			await this.usersService.receiveAnalysis({ id, analysis });
		} catch (error: any) {
			this.logger.error(error);
		}
	}
}