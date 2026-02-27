declare namespace NodeJS {
    interface ProcessEnv {
        TOKEN?: string;
        TOKEN_DEV?: string;
        MONGO_URI?: string;
        MONGO_URI_DEV?: string;
        [key: string]: string | undefined;
    }
}
