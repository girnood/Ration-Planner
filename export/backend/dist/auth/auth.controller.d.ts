import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        phone: string;
        role?: 'CUSTOMER' | 'PROVIDER';
    }): Promise<{
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
