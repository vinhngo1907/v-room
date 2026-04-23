export interface KafkaConfig {
    host: string;
    port: number;
    password: string;
    db: number;
    ex: number;
}

export interface HeaderConfig {
    userId: string;
    isAdmin: string;
}

export interface DocConfig {
    docUser: string;
    docPass: string;
}

export type HttpMethod = 'get' | 'post' | 'put' | 'delete'