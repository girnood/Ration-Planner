import { UserRole } from '@prisma/client';
export declare class AuthService {
    private prisma;
    login(phone: string, role?: UserRole): Promise<{
        access_token: string;
        user: {
            id: string;
            phone: string;
            role: import(".prisma/client").$Enums.UserRole;
            is_active: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
