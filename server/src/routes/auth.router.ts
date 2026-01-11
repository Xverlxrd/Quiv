// src/routes/auth.router.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController(new AuthService());

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/validate-token', authController.validateToken.bind(authController));

router.get('/profile', authMiddleware, authController.getProfile.bind(authController));
router.put('/profile', authMiddleware, authController.updateProfile.bind(authController));
router.put('/change-password', authMiddleware, authController.changePassword.bind(authController));

export const authRouter = router;