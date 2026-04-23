type commonUserData = {
	id: string;
	login: string;
	email: string;
	active: boolean;
	created_at: Date;
};

export type userAnalysisDto = {
	spam?: number;
	toxic?: number;
	severe_toxic?: number;
	obscene?: number;
	threat?: number;
	insult?: number;
	identity_hate?: number;
};

export type repoRegistrationParamDto = {
	login: string;
	email: string;
	password: string;
	salt: string;
	passwordRepeat: string;
	active: boolean;
	created_at: Date;
};

export type userDto = commonUserData & {
	password: string;
	salt: string;
	analysis?: userAnalysisDto;
};

export type usersListDto = {
	users: commonUserData[];
	count: number;
};