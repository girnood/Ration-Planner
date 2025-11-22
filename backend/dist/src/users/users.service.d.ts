import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createUser(data: Prisma.UserCreateInput): Promise<any>;
    findById(id: string): Promise<any>;
    findByPhone(phone: string): Promise<any>;
    ensureUser(phone: string, role?: UserRole): Promise<any>;
}
