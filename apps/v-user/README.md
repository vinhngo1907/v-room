
## Microservices for beginners. User service. Nest js. Mongodb. Kafka.

User service provides functionality for users in application. This service contains all users data, gives the ability to register new users, login in the application, receive information about users, and manage status of user - is active or not. I use Nest.js for backend, Mongo database and Kafka as message broker.

Full code - [link](https://github.com/vinhngo1907/v-room)

### Whole scheme:

![Containers](../../docs/img/v-containers.png)

Short description:

- User opens the front-end application in the browser, and tries to create a new account and login, after the login user can see a list of other users.
- Front-end service requests data from the api gateway.
- Api gateway sends http requests to the users service.
- Also the users service subscribes to events from spam and toxic services, and after several toxic messages users will be deactivated.

### Scheme of user service:

![Code](../../docs/img/users-code.png)

`main.ts` - initialization of service. I use `swagger` as documentation and REST client for testing of http requests.

```typescript
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as basicAuth from 'express-basic-auth';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);

  app.use(
    ['/swagger'],
    basicAuth({
      challenge: true,
      users: {
        [configService.get<string>('DOC_USER')]:
          configService.get<string>('DOC_PASS'),
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Service')
    .setDescription('User Service API description')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(configService.get<string>('APP_PORT'));
}
bootstrap();
```

`app.module.ts` - contains list of modules:
- ConfigModule - provides configuration, from `config/.env.dev` for dev, or environment variables.
- MongooseModule - Mongoose ODM for database interactions.
- UsersRepoModule - I put all database requests in one separated module.
- UsersModule - provides functionality for management of users.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { UsersRepoModule } from 'src/modules/users-repo/users.repo.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        __dirname + '/../config/.env.prod',
        __dirname + '/../config/.env.dev',
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Users repo module

`users.repo.module.ts` - describes module.

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersRepoService } from './users.repo.service';
import { UserSchema, User } from './users.repo.schema';

@Module({
  providers: [UsersRepoService],
  exports: [UsersRepoService],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
export class UsersRepoModule {}
```

`users.repo.service.ts` - contains database operations through Mongoose ODM

```typescript
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './users.repo.schema';
import {
  FindAllDto,
  FindByIdsDto,
  userDto,
  repoRegistrationParamDto,
  usersListDto,
} from 'micro-dto';
import { saveAnalysisDto, findActiveUserDto } from 'src/dto/index.dto';

@Injectable()
export class UsersRepoService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  getUserDto(user: UserDocument | undefined): userDto | undefined {
    if (user) {
      const {
        _id,
        login,
        password,
        salt,
        email,
        active,
        created_at,
        analysis,
      } = user;

      return {
        id: _id.toString(),
        login,
        password,
        salt,
        email,
        active,
        created_at,
        analysis,
      };
    }
  }

  /**
   * Find active user
   */
  async findActiveUser(param: findActiveUserDto): Promise<userDto | undefined> {
    const { id, login } = param;
    if (!id && !login) {
      return undefined;
    }

    const user = await this.userModel.findOne({
      ...(id ? { _id: id } : {}),
      ...(login ? { login } : {}),
      active: true,
    });

    return this.getUserDto(user);
  }

  /**
   * Find user by id
   */
  async findById(param: { id: string }): Promise<userDto | undefined> {
    if (!param.id) {
      return;
    }
    const { id } = param;
    const user = await this.userModel.findOne({ _id: id });

    return this.getUserDto(user);
  }

  /**
   * Find user by login
   */
  async findByLogin(param: { login: string }): Promise<userDto | undefined> {
    if (!param.login) {
      return;
    }
    const { login } = param;
    const user = await this.userModel.findOne({ login });

    return this.getUserDto(user);
  }

  /**
   * Find users for list view
   */
  async findAll(param: FindAllDto): Promise<usersListDto> {
    const {
      skip = 0,
      limit = 2,
      sortAsc = 'asc',
      login = '',
      excludeIds,
    } = param;

    const sortField =
      param.sortField === 'id' || !param.sortField ? '_id' : param.sortField;

    const users = await this.userModel
      .find({
        active: true,
        ...(login ? { $text: { $search: login } } : {}),
        ...(excludeIds ? { _id: { $nin: excludeIds } } : {}),
      })
      .sort({ [sortField]: sortAsc === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const count = await this.userModel.count({
      active: true,
    });

    return {
      users: users.map((user) => this.getUserDto(user)),
      count,
    };
  }

  /**
   * Create user
   */
  async registration(
    registrationDto: repoRegistrationParamDto,
  ): Promise<userDto | undefined> {
    const user = await this.userModel.create(registrationDto);

    return this.getUserDto(user);
  }

  /**
   * Find few users by ids
   */
  async findByIds(param: FindByIdsDto): Promise<usersListDto> {
    const users = await this.userModel.find({
      active: true,
      _id: { $in: param.ids },
    });

    return {
      users: users.map((user) => this.getUserDto(user)),
      count: users.length,
    };
  }

  /**
   * Save analysis of messages
   */
  async saveAnalysis(param: saveAnalysisDto): Promise<any> {
    const { id, analysis, active } = param;
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          analysis,
          ...(typeof active === 'boolean' ? { active } : {}),
        },
      },
    );
  }
}
```

`users.repo.schema.ts` - schema for the users collection.

```typescript
import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { userAnalysisDto } from 'micro-dto';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ type: String, required: true, unique: true })
  login: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  salt: string;

  @Prop({ type: Boolean })
  active: boolean;

  @Prop({ type: Date })
  created_at: Date;

  @Prop({ type: Object })
  analysis: userAnalysisDto;
}

export const UserSchema = SchemaFactory.createForClass(User);

```

### Users module

`users.module.ts` - describes the module.
```typescript
import { Module } from '@nestjs/common';
import { UsersHelper } from './users.helper';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { KafkaController } from './kafka.controller';
import { UsersRepoModule } from 'src/modules/users-repo/users.repo.module';

@Module({
  providers: [UsersService, UsersHelper],
  exports: [UsersService],
  controllers: [UsersController, KafkaController],
  imports: [UsersRepoModule],
})
export class UsersModule {}
```

`users.controller.ts` - provides REST API for front-end service
```typescript
import {
  Controller,
  Get,
  Param,
  UsePipes,
  Post,
  Body,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  FindAllDto,
  FindByIdDto,
  WebUserDto,
  WebUsersAllDto,
  WebLoginParamDto,
  WebRegistrationParamDto,
  FindByIdsDto,
} from 'micro-dto';
import { JoiValidationPipe } from 'src/pipes/joi.validation.pipe';
import { UsersService } from './users.service';
import {
  loginJoi,
  findAllJoi,
  findByIdJoi,
  findByIdsJoi,
  registrationJoi,
} from './users.joi';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('/login')
  @ApiTags('Authorization')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
    type: WebUserDto,
  })
  @UsePipes(new JoiValidationPipe(loginJoi))
  async login(@Body() body: WebLoginParamDto): Promise<WebUserDto> {
    return this.usersService.login(body);
  }

  @Post('/registration')
  @ApiTags('Authorization')
  @ApiOperation({ summary: 'Registration of new user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
    type: WebUserDto,
  })
  @UsePipes(new JoiValidationPipe(registrationJoi))
  async registration(
    @Body() body: WebRegistrationParamDto,
  ): Promise<WebUserDto> {
    try {
      return await this.usersService.registration(body);
    } catch (error) {
      if (error?.code === 11000) {
        throw new BadRequestException('Duplicate user', {
          cause: error,
          description: 'User with same login or email already exists',
        });
      }

      throw new BadRequestException(error.message, {
        cause: error,
        description: error.message,
      });
    }
  }

  @Get('/find-all')
  @ApiTags('Users')
  @ApiOperation({ summary: 'List of users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
    type: WebUsersAllDto,
  })
  @UsePipes(new JoiValidationPipe(findAllJoi))
  findAll(@Query() params: FindAllDto): Promise<WebUsersAllDto> {
    if (params.excludeIds && typeof params.excludeIds === 'string') {
      params.excludeIds = [params.excludeIds];
    }
    return this.usersService.findAll(params);
  }

  @Get('/find-one/:id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiTags('Users')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
    type: WebUserDto,
  })
  @UsePipes(new JoiValidationPipe(findByIdJoi))
  findOne(@Param() params: FindByIdDto): Promise<WebUserDto> {
    return this.usersService.findById(params);
  }

  @Get('/find-by-ids')
  @ApiTags('Users')
  @ApiOperation({ summary: 'List of users by ids' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
    type: WebUsersAllDto,
  })
  @UsePipes(new JoiValidationPipe(findByIdsJoi))
  findByIds(@Query() params: FindByIdsDto): Promise<WebUsersAllDto> {
    if (params.ids && typeof params.ids === 'string') {
      params.ids = [params.ids];
    }

    return this.usersService.findByIds(params);
  }
}
```

`users.joi.ts` - provides validation for users.controller
```typescript
import * as Joi from 'joi';

export const registrationJoi = Joi.object({
  login: Joi.string().min(3).max(100).required(),
  email: Joi.string().max(100).required().email(),
  password: Joi.string().max(100).required(),
  passwordRepeat: Joi.ref('password'),
}).with('password', 'passwordRepeat');

export const loginJoi = Joi.object({
  login: Joi.string().max(100).required(),
  password: Joi.string().max(100).required(),
});

export const findByIdJoi = Joi.object({
  id: Joi.string().length(24).required(),
});

export const findAllJoi = Joi.object({
  excludeIds: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string(),
  ),
  login: Joi.string().min(3).max(100),
  skip: Joi.number().min(0),
  limit: Joi.number().min(1).max(100),
  sortField: Joi.string().valid(...['id', 'login']),
  sortAsc: Joi.string().valid(...['asc', 'desc']),
});

export const findByIdsJoi = Joi.object({
  ids: Joi.array().min(1).items(Joi.string().length(24)),
});
```

`kafka.controller.ts` - subscribes to the kafka topic and listens to events from toxic and spam services.
```typescript
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';
import {
  Controller,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { messageAnalysisDto } from 'micro-dto';
import { UsersService } from './users.service';

@Controller()
export class KafkaController implements OnModuleInit, OnModuleDestroy {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  private readonly logger = new Logger(KafkaController.name);

  private readonly kafka: Kafka = new Kafka({
    clientId: 'user_service',
    brokers: [this.configService.get<string>('KAFKA_URI')],
  });

  private readonly analysisConsumer: Consumer = this.kafka.consumer({
    groupId: this.configService.get<string>('KAFKA_ANALYSIS_MESSAGE_GROUP'),
  });

  async onModuleInit() {
    try {
      await this.analysisConsumer.subscribe({
        topic: this.configService.get<string>('KAFKA_ANALYSIS_MESSAGE_TOPIC'),
        fromBeginning: true,
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
      await this.usersService.receiveAnalysis({ id, analysis });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
```

`users.service.ts` - contains domain and application logic for users service. For example I want to block a user if he writes more than 5 toxic or spam messages, `kafka.controller` launches this method for every message from kafka topic, and `users.service` uses `users-repo` to manage user data.
```typescript
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  WebUserDto,
  FindByIdDto,
  WebLoginParamDto,
  WebRegistrationParamDto,
  FindAllDto,
  WebUsersAllDto,
  FindByIdsDto,
  userDto,
  messageAnalysisDto,
  userAnalysisDto,
} from 'micro-dto';
import { saveAnalysisDto } from 'src/dto/index.dto';
import { UsersHelper } from './users.helper';
import { ConfigService } from '@nestjs/config';
import { UsersRepoService } from 'src/modules/users-repo/users.repo.service';

@Injectable()
export class UsersService {
  constructor(
    private usersRepoService: UsersRepoService,
    private usersHelper: UsersHelper,
    private configService: ConfigService,
  ) {}

  async login(loginDto: WebLoginParamDto): Promise<WebUserDto> {
    if (!loginDto.login) {
      throw new BadRequestException('User not found');
    }
    const user = await this.usersRepoService.findByLogin(loginDto);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!user.active) {
      throw new BadRequestException('User blocked');
    }

    const isMatch = await this.usersHelper.isMatchPassword({
      passwordTyped: loginDto.password,
      salt: user.salt,
      password: user.password,
    });
    if (!isMatch) {
      throw new BadRequestException('Password invalid');
    }
    const { id, login, email, active, created_at } = user;

    return { id: id, login, email, active, created_at };
  }

  async registration(
    registrationDto: WebRegistrationParamDto,
  ): Promise<WebUserDto> {
    const { password, salt } = await this.usersHelper.generatePassword(
      registrationDto.password,
    );

    const { id, login, email, active, created_at } =
      await this.usersRepoService.registration({
        ...registrationDto,
        password,
        salt,
        active: true,
        created_at: new Date(),
      });
    return { id, login, email, active, created_at };
  }

  async findById(findOneParam: FindByIdDto): Promise<WebUserDto | undefined> {
    const user = await this.usersRepoService.findActiveUser(findOneParam);
    if (!user) {
      return;
    }
    const { id, login, email, active, created_at } = user;
    return { id: id, login, email, active, created_at };
  }

  async findAll(param: FindAllDto): Promise<WebUsersAllDto | undefined> {
    const usersList = await this.usersRepoService.findAll(param);
    usersList.users = usersList.users.map((user: userDto) => {
      const { id, login, email, active, created_at } = user;

      return { id, login, email, active, created_at };
    });

    return usersList;
  }

  async findByIds(param: FindByIdsDto): Promise<WebUsersAllDto | undefined> {
    const usersList = await this.usersRepoService.findByIds(param);
    usersList.users = usersList.users.map((user: userDto) => {
      const { id, login, email, active, created_at } = user;

      return { id, login, email, active, created_at };
    });

    return usersList;
  }

  async receiveAnalysis(param: {
    id: string;
    analysis: messageAnalysisDto;
  }): Promise<any> {
    const { id, analysis } = param;
    const user = await this.usersRepoService.findById({ id });
    if (!user) {
      return;
    }

    const newAnalysis: userAnalysisDto = [
      'spam',
      'toxic',
      'severe_toxic',
      'obscene',
      'threat',
      'insult',
      'identity_hate',
    ].reduce((acc, key) => {
      acc[key] = user.analysis?.[key] || 0;
      if (analysis[key]) {
        acc[key] += 1;
      }
      return acc;
    }, {});

    const violationLimit = this.configService.get<number>('VIOLATION_LIMIT');
    const violationCount = newAnalysis.toxic + newAnalysis.spam;
    const updateParam: saveAnalysisDto = {
      id: user.id,
      analysis: newAnalysis,
    };

    if (violationCount > violationLimit) {
      updateParam.active = false;
    }

    await this.usersRepoService.saveAnalysis(updateParam);
  }
}
```

`users.helper.ts` - provides for `users.service` some application functionality, like hash of password.
```typescript
import { Injectable } from '@nestjs/common';
import { pbkdf2, randomBytes } from 'node:crypto';
import { promisify } from 'util';
import { generatedPasswordDto, isMatchPasswordDto } from 'src/dto/index.dto';

const pbkdf2Promise = promisify(pbkdf2);

@Injectable()
export class UsersHelper {
  async generatePassword(password: string): Promise<generatedPasswordDto> {
    const salt = randomBytes(16).toString('hex');

    const passwordHashed = await pbkdf2Promise(
      password,
      salt,
      1000,
      32,
      'sha512',
    );

    return {
      password: passwordHashed.toString('hex'),
      salt: salt,
    };
  }

  async isMatchPassword({
    passwordTyped,
    salt,
    password,
  }: isMatchPasswordDto): Promise<boolean> {
    const passwordHashed = await pbkdf2Promise(
      passwordTyped,
      salt,
      1000,
      32,
      'sha512',
    );

    return passwordHashed.toString('hex') === password;
  }
}
```

### Additionally:

How to install Mongo from docker:

Download docker container, launch with required properties, and open console:
```
docker pull mongo
docker run -d --name micro-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=micro_user -e MONGO_INITDB_ROOT_PASSWORD=micro_pwd mongo
docker exec -it micro-mongo mongosh
```

Settings for database and text index:
```
use admin
db.auth('micro_user', 'micro_pwd')
use micro_users
db.createUser(
  {
    user: 'micro_user',
    pwd: 'micro_pwd',
    roles: [
       { db: 'micro_users', role: 'dbAdmin', },
       { db: 'micro_users', role: 'readWrite', }
    ]
  }
);
db.users.createIndex({ login: 'text' });
```

How to install Kafka from docker:

Download docker-compose from github - https://github.com/tchiotludo/akhq.
Launch docker-compose:
```
docker-compose pull
docker-compose up -d
```

Settings:
```
KAFKA_LISTENERS: INTERNAL://0.0.0.0:9092,OUTSIDE://0.0.0.0:9094
KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka:9092,OUTSIDE://localhost:9094
KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,OUTSIDE:PLAINTEXT
KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
```

```
npm i --save kafkajs
```

Testing
```
npm run test
```

Docker
```
docker build -t igordubinin/micro-user-service .
docker run -e MONGO_URI=mongodb://micro_user:micro_pwd@192.168.101.6:27017/micro_users -e KAFKA_URI=192.168.101.6:9094 -v ~/Data/Work/video-project/user-service:/home/node/app --name micro-user-service -p 3002:3002 -d igordubinin/micro-user-service
```

Vscode - `Dev Containers` extension
Click `Remote Explorer`, select in top menu - `Dev Containers` and connect to selected container.
