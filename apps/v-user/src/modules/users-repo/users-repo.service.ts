import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
    userDto,
    repoRegistrationParamDto,
    FindAllDto,
    WebUsersAllDto,
    FindByIdDto,
    WebUserDto,
    FindByIdsDto,
    usersListDto,
} from '@libs/v-dto';
// import { findActiveUserDto, saveAnalysisDto } from 'src/dto/index.dto';
import { findActiveUserDto, saveAnalysisDto } from '../../dto/index.dto';
import { User, UserDocument } from './users-repo.schema';

@Injectable()
export class UsersRepoService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) { }

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

    async findById(param: FindByIdDto): Promise<userDto | undefined> {
        if (!param.id) {
            return;
        }
        const { id } = param;
        const user = await this.userModel.findOne({ _id: id });

        return this.getUserDto(user);
    }

    async findByLogin(param: { login: string }): Promise<userDto | undefined> {
        if (!param.login) {
            return;
        }

        const { login } = param;
        const user = await this.userModel.findOne({ login });

        return this.getUserDto(user);
    }

    async registration(
        registrationDto: repoRegistrationParamDto,
    ): Promise<userDto | undefined> {
        const user = await this.userModel.create(registrationDto);

        return this.getUserDto(user);
    }

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

    async findActiveUser(param: findActiveUserDto): Promise<userDto | undefined> {
        const { id, login } = param;
        if (!id && !login) {
            return undefined;
        }

        const user = await this.userModel.findOne({
            ...(id ? { _id: id } : {}),
            ...(login ? { login } : {}),
            active: true
        });
        return this.getUserDto(user);
    }

    async findByIds(param: FindByIdsDto): Promise<usersListDto> {
        const users = await this.userModel.find({
            active: true,
            _id: { $in: param.ids }
        });

        return {
            users: users.map(u => this.getUserDto(u)),
            count: users.length
        }
    }
}
