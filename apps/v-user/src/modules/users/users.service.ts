import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersHelper } from './users.helper';
import { FindAllDto, FindByIdDto, FindByIdsDto, messageAnalysisDto, userAnalysisDto, userDto, WebLoginParamDto, WebRegistrationParamDto, WebUserDto, WebUsersAllDto } from '@libs/v-dto';
import { UsersRepoService } from '../users-repo/users-repo.service';
import { saveAnalysisDto } from '../../dto/index.dto';

@Injectable()
export class UsersService {
    constructor(
        private configService: ConfigService,
        private usersHelper: UsersHelper,
        private usersRepoService: UsersRepoService
    ) { }

    async receiveAnalysis(params: {
        id: string,
        analysis: messageAnalysisDto
    }): Promise<any> {
        const { id, analysis } = params;
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
            analysis: newAnalysis
        }

        if (violationCount > violationLimit) {
            updateParam.active = false;
        }

        await this.usersRepoService.saveAnalysis(updateParam);
    }

    async login(loginDto: WebLoginParamDto): Promise<WebUserDto> {
        if (!loginDto.login) {
            throw new BadRequestException('User not found');
        }

        const user = await this.usersRepoService.findByLogin(loginDto);
        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        if (!user.active) {
            throw new BadRequestException('User is blocked')
        }

        const isMatch = await this.usersHelper.isMatchPassword({
            passwordTyped: loginDto.password,
            salt: user.salt,
            password: user.password
        });

        if (!isMatch) {
            throw new BadRequestException("Password invalid");
        }

        // const { id, login, email, active, created_at } = user;
        delete user.password;
        delete user.analysis;
        delete user.salt;
        return user;
    }

    async registration(registerDto: WebRegistrationParamDto): Promise<WebUserDto> {
        const { password, salt } = await this.usersHelper.generatePassword(
            registerDto.password,
        );

        const { id, login, email, active, created_at } =
            await this.usersRepoService.registration({
                ...registerDto,
                password,
                salt,
                active: true,
                created_at: new Date(),
            });
        return { id, login, email, active, created_at };
    }

    async findAll(param: FindAllDto): Promise<WebUsersAllDto | undefined> {
        const usersList = await this.usersRepoService.findAll(param);

        // usersList.users = usersList.users.map((user: userDto) => {
        //     const { id, login, email, active, created_at } = user;

        //     return { id, login, email, active, created_at };
        // });


        usersList.users = usersList.users.map((u) => ({
            id: u.id,
            email: u.email,
            login: u.login,
            active: u.active,
            created_at: u.created_at,
        }));

        return usersList;
    }


    async findById(param: FindByIdDto): Promise<WebUserDto | undefined> {
        const user = await this.usersRepoService.findActiveUser(param);
        if (!user) {
            return;
        }
        const { id, login, email, active, created_at } = user;
        return { id, login, email, active, created_at };
    }

    async findByIds(param: FindByIdsDto): Promise<WebUsersAllDto | undefined> {
        const usersList = await this.usersRepoService.findByIds(param);
        // usersList.users = usersList.users.map((u: userDto) => {
        //     const { id, email, login, active, created_at } = u;
        //     return { id, email, login, active, created_at };
        // });
        usersList.users = usersList.users.map((u) => ({
            id: u.id,
            email: u.email,
            login: u.login,
            active: u.active,
            created_at: u.created_at,
        }));

        return usersList;
    }
}
