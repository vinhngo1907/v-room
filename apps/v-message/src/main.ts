import { NestFactory } from '@nestjs/core';
// import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as basicAuth from 'express-basic-auth';
import { AppConfigService } from 'src/modules/config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const configService: ConfigService = app.get(ConfigService);
  const appConfigService = app.get<AppConfigService>(AppConfigService);

  app.use(
    ['/swagger'],
    basicAuth.default({
      challenge: true,
      users: {
        // [configService.get<string>('DOC_USER')]:
        //   configService.get<string>('DOC_PASS'),
        [appConfigService.swaggerConfig.user]:
          appConfigService.swaggerConfig.pass,
      },
    }),
  );
  await app.listen(appConfigService.port);
}
bootstrap();
