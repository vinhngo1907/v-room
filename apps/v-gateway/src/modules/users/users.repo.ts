import { FindAllDto, FindByIdDto, WebUserDto, WebUsersAllDto } from '@libs/v-dto';
import { HttpMethod } from '@modules/users/user.type';
import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersRepo {
    constructor(
        private configService: ConfigService,
        private readonly httpService: HttpService
    ) { }

    errorMessage: string = 'Oops something went wrong';

    async usersRequest(method: HttpMethod, url: string, param?: any) {
        try {
            const uri = `${this.configService.get<string>('API_USERS')}/${url}`;
            const response = await this.httpService.axiosRef?.[method](uri, param);
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.statusCode == 400) {
                throw new BadRequestException(error.response.dat.message);
            }
            throw new InternalServerErrorException(
                error.response?.data?.message || this.errorMessage
            )
        }
    }

    async findAll(param: FindAllDto): Promise<WebUsersAllDto> {
        const searchParam = new URLSearchParams(Object.entries(param).map((p) => p),);
        let url = `users/find-all?${searchParam.toString()}`;
        return this.usersRequest('get', url);
    }

    async findUserById(param: FindByIdDto): Promise<WebUserDto> {
        return await this.usersRequest('get', `/users/find-one/${param.id}`);
    }
}