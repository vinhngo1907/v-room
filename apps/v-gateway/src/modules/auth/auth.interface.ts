import { WebUserDto } from '@libs/v-dto';
import { Request } from 'express';
import { Socket } from 'socket.io';
export interface RequestWithUser extends Request {
    user: WebUserDto;
}

export interface AuthSocket extends Socket {
    handshake: Socket['handshake'] & {
        user: { id: string };
    };
}