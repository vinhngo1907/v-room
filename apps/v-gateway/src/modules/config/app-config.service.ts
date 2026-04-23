import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configKeys } from './constants';
import { DocConfig, HeaderConfig, KafkaConfig } from 'src/types';

@Injectable()
export class AppConfigService {
    constructor(private configService: ConfigService) { }

    get JwtExpiration(): number {
        return this.configService.get(configKeys.JWT_EXPIRES) || 10 * 60 * 1000;
    }

    get port(): number {
        return this.configService.get(configKeys.HTTP_SERVER_PORT) || 3000;
    }

    get jwtSecret(): string {
        return this.configService.get(configKeys.JWT_SECRET)!;
    }

    get kafkaConfig(): KafkaConfig {
        return {
            host: this.configService.get(configKeys.KAFKA_HOST)!,
            port: this.configService.get(configKeys.KAFKA_PORT)!,
            password: this.configService.get(configKeys.KAFKA_PASSWORD)!,
            db: this.configService.get(configKeys.KAFKA_DB)!,
            ex: this.configService.get(configKeys.KAFKA_EX)!,
        };
    }

    get docConfig(): DocConfig {
        return {
            docUser: this.configService.get(configKeys.DOC_USER)!,
            docPass: this.configService.get(configKeys.DOC_PASS)!,
        }
    }

    get socketPort(): number | string {
        return this.configService.get(configKeys.SOCKET_PORT) || 3000;
    }

    // getHeaderConfig(): HeaderConfig {
    //     return {
    //         userId: this.configService.get(configKeys.HEADER_USER_ID)!,
    //         isAdmin: this.configService.get(configKeys.HEADER_IS_ADMIN)!,
    //     };
    // }
}