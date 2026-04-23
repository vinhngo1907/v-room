import { FindByIdDto, WebLoginParamDto, WebRegistrationParamDto, WebUserDto } from "@libs/v-dto";
// import { HttpMethod } from "@modules/users/user.type";
import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpMethod } from "src/types";

@Injectable()
export class AuthRepo {
	constructor(
		private configService: ConfigService,
		private readonly httpService: HttpService,
	) { }

	errorMessage: string = 'Oops something wrong';

	private async usersRequest(method: HttpMethod, url: string, param?: any) {
		try {
			const uri = `${this.configService.get<string>('API_USERS')}${url}`;
			const response = await this.httpService.axiosRef?.[method](uri, param);
			return response.data;
		} catch (error: any) {
			if (error.response?.data?.statusCode == 400) {
				throw new BadRequestException(error.response.data.message);
			}
			throw new InternalServerErrorException(
				error.response?.data?.message || this.errorMessage
			)
		}
	}
	async login(param: WebLoginParamDto): Promise<WebUserDto> {
		return await this.usersRequest('post', '/users/login', param);
	}

	async registration(param: WebRegistrationParamDto): Promise<WebUserDto> {
		return await this.usersRequest('post', '/users/register', param);
	}

	async findUserById(param: FindByIdDto): Promise<WebUserDto> {
		return await this.usersRequest('get', `/users/find-one/${param.id}`);
	}
}