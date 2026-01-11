import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import {
    RegisterDto,
    LoginDto,
    UpdateProfileDto,
    ChangePasswordDto,
} from '../../types/auth';

export class AuthController {
    private authService: AuthService;

    constructor(authService?: AuthService) {
        this.authService = authService || new AuthService();
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
            const registerDto: RegisterDto = req.body;

            if (!registerDto.login || !registerDto.password) {
                res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны для заполнения'
                });
                return;
            }

            if (registerDto.email && !this.isValidEmail(registerDto.email)) {
                res.status(400).json({
                    success: false,
                    error: 'Некорректный формат email'
                });
                return;
            }

            if (!this.isValidPassword(registerDto.password)) {
                res.status(400).json({
                    success: false,
                    error: 'Пароль должен содержать минимум 8 символов, включая цифры и буквы'
                });
                return;
            }

            const result = await this.authService.register(registerDto);

            res.status(201).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    expiresIn: 15 * 60
                },
                message: 'Регистрация успешно завершена'
            });
        } catch (error: any) {
            console.error('Registration error:', error);

            if (error.message.includes('уже существует')) {
                res.status(409).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message || 'Ошибка при регистрации'
                });
            }
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const loginDto: LoginDto = req.body;

            if (!loginDto.login || !loginDto.password) {
                res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны'
                });
                return;
            }

            const result = await this.authService.login(loginDto);

            res.status(200).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    expiresIn: 15 * 60
                },
                message: 'Авторизация успешна'
            });
        } catch (error: any) {
            console.error('Login error:', error);

            if (error.message.includes('Неверные') || error.message.includes('заблокирован')) {
                res.status(401).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Ошибка при авторизации'
                });
            }
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: 'Refresh токен обязателен'
                });
                return;
            }

            const result = await this.authService.refreshToken(refreshToken);

            res.status(200).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    expiresIn: 15 * 60
                },
                message: 'Токены успешно обновлены'
            });
        } catch (error: any) {
            console.error('Refresh token error:', error);

            if (error.message.includes('Невалидный') || error.message.includes('не найден')) {
                res.status(401).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Ошибка обновления токенов'
                });
            }
        }
    }

    async validateToken(req: Request, res: Response): Promise<void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    error: 'Токен отсутствует или имеет неверный формат'
                });
                return;
            }

            const token = authHeader.split(' ')[1];
            const payload = await this.authService.validateToken(token);

            res.status(200).json({
                success: true,
                data: {
                    user: payload,
                    valid: true
                },
                message: 'Токен валиден'
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: error.message || 'Токен невалиден',
                data: { valid: false }
            });
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Пользователь не аутентифицирован'
                });
                return;
            }

            const user = await this.authService.getUserById(userId);

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'Пользователь не найден'
                });
                return;
            }

            const { password, ...userWithoutPassword } = user;

            res.status(200).json({
                success: true,
                data: userWithoutPassword,
                message: 'Профиль успешно получен'
            });
        } catch (error: any) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка получения профиля'
            });
        }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Пользователь не аутентифицирован'
                });
                return;
            }

            const updateData: UpdateProfileDto = req.body;

            if (updateData.email && !this.isValidEmail(updateData.email)) {
                res.status(400).json({
                    success: false,
                    error: 'Некорректный формат email'
                });
                return;
            }

            const updatedUser = await this.authService.updateProfile(userId, updateData);

            const { password, ...userWithoutPassword } = updatedUser;

            res.status(200).json({
                success: true,
                data: userWithoutPassword,
                message: 'Профиль успешно обновлен'
            });
        } catch (error: any) {
            console.error('Update profile error:', error);

            if (error.message.includes('не найден')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message || 'Ошибка обновления профиля'
                });
            }
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Пользователь не аутентифицирован'
                });
                return;
            }

            const changePasswordDto: ChangePasswordDto = req.body;

            if (!changePasswordDto.currentPassword ||
                !changePasswordDto.newPassword ||
                !changePasswordDto.confirmPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Все поля обязательны для заполнения'
                });
                return;
            }

            if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Новый пароль и подтверждение не совпадают'
                });
                return;
            }

            if (!this.isValidPassword(changePasswordDto.newPassword)) {
                res.status(400).json({
                    success: false,
                    error: 'Новый пароль должен содержать минимум 8 символов, включая цифры и буквы'
                });
                return;
            }

            await this.authService.changePassword(
                userId,
                changePasswordDto.currentPassword,
                changePasswordDto.newPassword
            );

            res.status(200).json({
                success: true,
                message: 'Пароль успешно изменен'
            });
        } catch (error: any) {
            console.error('Change password error:', error);

            if (error.message.includes('Неверный текущий пароль')) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            } else if (error.message.includes('не найден')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Ошибка смены пароля'
                });
            }
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPassword(password: string): boolean {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    }
}
