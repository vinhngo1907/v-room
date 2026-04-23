import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtSocketGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        try {
            const client = context.switchToWs().getClient();
            const data = context.switchToWs().getData();
            const user: any = jwt.verify(
                data.token || '',
                this.configService.get<string>('JWT_SECRET')!,
            );
            client.handshake.user = user;
            return true;
        } catch (error: any) {
            throw new WsException(error.message);
        }
    }
}