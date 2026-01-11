export class RegisterDto {
    login: string;
    password: string;
    email?: string;
    name?: string;
    avatar?: string;
}

export class UpdateProfileDto {
    name?: string;
    email?: string;
    avatar?: string;
}

export class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export class LoginDto {
    login: string;
    password: string;
}

export interface ITokenPayload {
    id: number;
    login: string;
    role: string;
    exp?: number;
    iat?: number;
}

export interface IAuthResponse {
    user: {
        id: number;
        login: string;
        name: string;
        email?: string;
        role: string;
        avatar?: string;
        isActive: boolean;
        createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
}