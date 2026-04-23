import { BadRequestException, Body, Controller, Get, HttpStatus, Param, Post, Query, UsePipes } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindAllDto, FindByIdDto, FindByIdsDto, WebLoginParamDto, WebRegistrationParamDto, WebUserDto, WebUsersAllDto } from '@libs/v-dto';
import { JoiValidationPipe } from '../../pipes/joi.validation.pipe';
import { findAllJoi, findByIdJoi, loginJoi, registrationJoi, findByIdsJoi } from './users.joi';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post("/login")
    @ApiTags('Authorization')
    @ApiOperation({ summary: "Login" })
    @ApiResponse({
        status: HttpStatus.OK,
        description: "Success",
        type: WebUserDto
    })
    @UsePipes(new JoiValidationPipe(loginJoi))
    async login(@Body() body: WebLoginParamDto): Promise<WebUserDto> {
        return this.usersService.login(body);
    }

    @Post("register")
    @ApiTags('Authorization')
    @ApiOperation({ summary: 'Registration of new user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
        type: WebUserDto,
    })
    @UsePipes(new JoiValidationPipe(registrationJoi))
    async register(@Body() body: WebRegistrationParamDto): Promise<WebUserDto> {
        try {
            return this.usersService.registration(body);
        } catch (error: any) {
            if (error?.code === 11000) {
                throw new BadRequestException('Duplicate user', {
                    cause: error,
                    description: 'User with same login or email already exists'
                });
            }

            throw new BadRequestException(error.message, {
                cause: error,
                description: error.message,
            });
        }
    }

    @Get("/find-all")
    @ApiTags("Users")
    @ApiOperation({ summary: "List All Users" })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
        type: WebUsersAllDto
    })
    @UsePipes(new JoiValidationPipe(findAllJoi))
    async getAll(@Query() params: FindAllDto): Promise<WebUsersAllDto> {
        if (params.excludeIds && typeof params.excludeIds === 'string') {
            params.excludeIds = [params.excludeIds];
        }
        return this.usersService.findAll(params);
    }

    @Get("/find-one/:id")
    @ApiTags("Users")
    @ApiOperation({ summary: "Get One User" })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
        type: WebUserDto
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
