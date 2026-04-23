import { Injectable } from '@nestjs/common';
import { pbkdf2, randomBytes } from 'node:crypto';
import { promisify } from 'util';
import { generatedPasswordDto, isMatchPasswordDto } from '../../dto/index.dto';

const pbkdf2Promise = promisify(pbkdf2);

@Injectable()
export class UsersHelper {
	async generatePassword(password: string): Promise<generatedPasswordDto> {
		const salt = randomBytes(16).toString('hex');

		const passwordHashed = await pbkdf2Promise(
			password,
			salt,
			1000,
			32,
			'sha512',
		);

		return {
			password: passwordHashed.toString('hex'),
			salt: salt,
		};
	}

	async isMatchPassword({
		passwordTyped,
		salt,
		password,
	}: isMatchPasswordDto): Promise<boolean> {
		const passwordHashed = await pbkdf2Promise(
			passwordTyped,
			salt,
			1000,
			32,
			'sha512',
		);

		return passwordHashed.toString('hex') === password;
	}
}
