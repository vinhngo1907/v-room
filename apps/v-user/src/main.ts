import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { ConfigService } from '@nestjs/config';
// import * as basicAuth from "express-basic-auth";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './modules/config/app-config.service';
// import { AppConfigService } from 'src/modules/config/app-config.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // app.useGlobalFilters(new HttpExceptionFilter());

    const appConfigService = app.get(AppConfigService);

    // const configService: ConfigService = app.get(ConfigService);
    // app.use(["/swagger"], basicAuth.default({
    //     challenge: true,
    //     users: {
    //         [configService.get<string>('DOC_USER')!]: configService.get<string>('DOC_PASS')
    //     }
    // }));
    // const swaggerConfig = new DocumentBuilder()
    //     .setTitle('User Service')
    //     .setDescription('User Service API description')
    //     .setVersion('0.0.1')
    //     .build();

    // const document = SwaggerModule.createDocument(app, swaggerConfig);

    // SwaggerModule.setup('swagger', app, document, {
    //     swaggerOptions: {
    //         persistAuthorization: true,
    //     },
    // });

    const port = appConfigService.port;
    setupSwagger(app);
    app.listen(port, () => {
        console.log(`User service is running on ${port}`, 'Bootstrap')
    })
    // await app.listen(configService.get<string>('APP_PORT'));
}

bootstrap();

function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('User service example')
        .setDescription('The user service API description')
        .setVersion('1.0')
        .addTag('auth')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
}