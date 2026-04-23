import { Module } from '@nestjs/common';
import { UsersRepoService } from './users-repo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from './users-repo.schema';
// import { UsersModule } from '../users/users.module';


@Module({
    providers: [UsersRepoService],
    exports: [UsersRepoService],
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
    ],
})
export class UsersRepoModule { }
