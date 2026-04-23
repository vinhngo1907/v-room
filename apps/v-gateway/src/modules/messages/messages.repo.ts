import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FindByIdsDto, PrivateRoomQueryDto, RoomDataDto, WebUsersAllDto } from '@libs/v-dto';
import { HttpMethod } from 'src/types';
// import { HttpMethod } from '@modules/messages/message.type';
@Injectable()
export class MessagesRepo {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService
    ) { }

    errorMessage: string = 'Oops something went wrong';

    async messagesRequest(method: HttpMethod, url: string, param?: any) {
        try {
            const uri = `${this.configService.get<string>('API_MESSAGES')}/${url}`;
            const response = await this.httpService.axiosRef?.[method](uri, param);
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.statusCode === 400) {
                throw new BadRequestException(error.response.data.message);
            }
            throw new InternalServerErrorException(
                error.response?.data?.message || this.errorMessage,
            );
        }
    }

    async usersRequest(method: HttpMethod, url: string, param?: any) {
        try {
            const uri = `${this.configService.get<string>('API_USERS')}/${url}`;
            const response = await this.httpService.axiosRef?.[method](uri, param);
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.statusCode === 400) {
                throw new BadRequestException(error.response.data.message);
            }
            throw new InternalServerErrorException(
                error.response?.data?.message || this.errorMessage,
            );
        }
    }

    async getPrivateRoom(param: PrivateRoomQueryDto): Promise<RoomDataDto> {
        const { userIds } = param;
        const searchParam = new URLSearchParams(
            userIds.map((id) => ['userIds', id]),
        );
        let url = `messages/get-private-room?${searchParam.toString()}`;

        return await this.messagesRequest('get', url);
    }

    async getUsersByIds(param: FindByIdsDto): Promise<WebUsersAllDto> {
        const { ids } = param;
        const searchParam = new URLSearchParams(ids.map((id) => ['ids', id]));
        let url = `users/find-by-ids?${searchParam.toString()}`;
        return await this.usersRequest('get', url);
    }
}
