import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const authMiddleware = async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        console.log('🔐 Auth middleware checking token...');

        const authHeader = req.headers.authorization;
        console.log('Authorization header:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No token or wrong format');
            res.status(401).json({
                success: false,
                error: 'Требуется аутентификация. Токен отсутствует или имеет неверный формат'
            });
            return;
        }

        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token?.substring(0, 20) + '...');

        const payload = await authService.validateToken(token);
        console.log('✅ Token valid, user:', payload);

        req.user = payload;
        next();
    } catch (error: any) {
        console.error('❌ Auth middleware error:', error.message);
        res.status(401).json({
            success: false,
            error: 'Невалидный токен'
        });
    }
};