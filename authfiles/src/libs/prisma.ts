import { PrismaClient } from '@prisma/client';
import config from '../config/index.js';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (config.isDevelopment) {
    globalThis.prisma = prisma;
}

export default prisma;
