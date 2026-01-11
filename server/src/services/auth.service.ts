import { Repository } from "typeorm";
import { User } from "../entity/User";
import { AppDataSource } from "../../data-source";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import {RegisterDto, LoginDto, ITokenPayload, IAuthResponse} from "../../types/auth";


export class AuthService {
    private userRepository: Repository<User>;
    private readonly jwtSecret: string;
    private readonly refreshTokenSecret: string;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

        if (!process.env.JWT_SECRET) {
            console.warn('JWT_SECRET is not set in environment variables');
        }
    }

    async register(registerDto: RegisterDto): Promise<IAuthResponse> {
        const existingUser = await this.userRepository.findOne({
            where: [
                { login: registerDto.login },
                { email: registerDto.email }
            ]
        });

        if (existingUser) {
            throw new Error('Пользователь с таким логином или email уже существует');
        }


        const hashedPassword = await bcrypt.hash(registerDto.password, 10);


        const user = this.userRepository.create({
            login: registerDto.login,
            password: hashedPassword,
            name: registerDto.name || registerDto.login,
            email: registerDto.email,
            role: 'user',
            isActive: true,
            avatar: registerDto.avatar
        });

        const savedUser = await this.userRepository.save(user);


        const tokens = this.generateTokens(savedUser);

        return {
            user: {
                id: savedUser.id,
                login: savedUser.login,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                avatar: savedUser.avatar,
                isActive: savedUser.isActive,
                createdAt: savedUser.createdAt
            },
            ...tokens
        };
    }

    async login(loginDto: LoginDto): Promise<IAuthResponse> {

        const user = await this.userRepository.findOne({
            where: { login: loginDto.login }
        });

        if (!user) {
            throw new Error('Неверные учетные данные');
        }

        if (!user.isActive) {
            throw new Error('Аккаунт заблокирован');
        }


        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            throw new Error('Неверные учетные данные');
        }


        const tokens = this.generateTokens(user);

        return {
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isActive: user.isActive,
                createdAt: user.createdAt
            },
            ...tokens
        };
    }

    async refreshToken(refreshToken: string): Promise<IAuthResponse> {
        try {

            const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as { id: number };


            const user = await this.userRepository.findOneBy({ id: decoded.id });

            if (!user) {
                throw new Error('Пользователь не найден');
            }

            if (!user.isActive) {
                throw new Error('Аккаунт заблокирован');
            }


            const tokens = this.generateTokens(user);

            return {
                user: {
                    id: user.id,
                    login: user.login,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                },
                ...tokens
            };
        } catch (error) {
            throw new Error('Невалидный refresh токен');
        }
    }

    async validateToken(accessToken: string): Promise<ITokenPayload> {
        try {
            const decoded = jwt.verify(accessToken, this.jwtSecret) as ITokenPayload;


            const user = await this.userRepository.findOneBy({ id: decoded.id });

            if (!user || !user.isActive) {
                throw new Error('Пользователь не найден или аккаунт заблокирован');
            }

            return decoded;
        } catch (error) {
            throw new Error('Невалидный токен');
        }
    }

    async getUserById(id: number): Promise<User | null> {
        return await this.userRepository.findOneBy({ id });
    }

    async updateProfile(userId: number, updateData: Partial<User>): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: userId });

        if (!user) {
            throw new Error('Пользователь не найден');
        }


        const { id, password, role, isActive, ...safeUpdateData } = updateData as any;

        Object.assign(user, safeUpdateData);

        return await this.userRepository.save(user);
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOneBy({ id: userId });

        if (!user) {
            throw new Error('Пользователь не найден');
        }


        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new Error('Неверный текущий пароль');
        }


        user.password = await bcrypt.hash(newPassword, 10);

        await this.userRepository.save(user);
    }

    private generateTokens(user: User): { accessToken: string; refreshToken: string } {
        const payload: ITokenPayload = {
            id: user.id,
            login: user.login,
            role: user.role
        };


        const accessToken = jwt.sign(
            payload,
            this.jwtSecret,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            this.refreshTokenSecret,
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }
}