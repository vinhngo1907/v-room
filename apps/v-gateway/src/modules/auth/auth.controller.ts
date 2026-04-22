import {
    BadRequestException, Body, Controller,
    HttpStatus, Post, Request, UseGuards, UsePipes
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { WebLoginParamDto, WebRegistrationParamDto, WebUserDto } from '@libs/v-dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { registrationJoi, loginJoi } from './auth.joi';
import { JoiValidationPipe } from 'src/infrastructure/pipes/joi.validation';
import { WebAccessTokens } from './auth.dto';
import { RefreshTokenGuard } from 'src/infrastructure/jwt/guard/jwt-refresh.guard';
import { RequestWithUser } from '@modules/auth/auth.interface';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post("/registration")
    @ApiTags('Authorization')
    @ApiOperation({ summary: 'Registration of new user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
        type: WebUserDto,
    })
    @UsePipes(new JoiValidationPipe(registrationJoi))
    async registration(@Body() body: WebRegistrationParamDto) {
        try {
            return this.authService.registration(body);
        } catch (error: any) {
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

    @Post('login')
    @ApiTags('Authorization')
    @ApiOperation({ summary: 'Login in application' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
        type: WebUserDto,
    })
    @UsePipes(new JoiValidationPipe(loginJoi))
    async login(@Body() body: WebLoginParamDto) {
        return await this.authService.login(body);
    }

    @Post('/refresh')
    @UseGuards(RefreshTokenGuard)
    @ApiTags('Authorization')
    @ApiOperation({ summary: 'Refresh of JWT token' })
    @ApiBearerAuth('JWT')
    async refresh(@Request() req: RequestWithUser): Promise<WebAccessTokens> {
        return this.authService.refresh(req.user);
    }
}
