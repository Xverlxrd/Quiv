import { Request, Response } from "express";
import { ContactService } from "../services/contact.service";
import {AuthService} from "../services/auth.service";

export class ContactController {
    private contactService: ContactService;
    private authService: AuthService;

    constructor() {
        this.contactService = new ContactService();
        this.authService = new AuthService();
    }

    private async authenticate(req: Request): Promise<number> {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Требуется аутентификация');
        }

        const token = authHeader.substring(7);

        try {
            const payload = await this.authService.validateToken(token);
            return payload.id;
        } catch (error) {
            throw new Error('Невалидный токен');
        }
    }

    async sendRequest(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const result = await this.contactService.sendRequest(userId, req.body);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async acceptRequest(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const contactId = parseInt(req.params.id);

            if (isNaN(contactId)) {
                throw new Error('Некорректный ID');
            }

            const result = await this.contactService.acceptRequest(userId, contactId);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async rejectRequest(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const contactId = parseInt(req.params.id);

            if (isNaN(contactId)) {
                throw new Error('Некорректный ID');
            }

            const result = await this.contactService.rejectRequest(userId, contactId);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async blockUser(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const targetUserId = parseInt(req.params.id);

            if (isNaN(targetUserId)) {
                throw new Error('Некорректный ID');
            }

            const result = await this.contactService.blockUser(userId, targetUserId);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async unblockUser(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const targetUserId = parseInt(req.params.id);

            if (isNaN(targetUserId)) {
                throw new Error('Некорректный ID');
            }

            await this.contactService.unblockUser(userId, targetUserId);

            res.json({
                success: true
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async removeContact(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const contactId = parseInt(req.params.id);

            if (isNaN(contactId)) {
                throw new Error('Некорректный ID');
            }

            await this.contactService.removeContact(userId, contactId);

            res.json({
                success: true
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getContacts(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const status = req.query.status as any;

            const result = await this.contactService.getContacts(userId, status);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getIncomingRequests(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const result = await this.contactService.getIncomingRequests(userId);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getOutgoingRequests(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const result = await this.contactService.getOutgoingRequests(userId);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getContactStatus(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const targetUserId = parseInt(req.params.id);

            if (isNaN(targetUserId)) {
                throw new Error('Некорректный ID');
            }

            const result = await this.contactService.getContactStatus(userId, targetUserId);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async searchUsers(req: Request, res: Response) {
        try {
            const userId = await this.authenticate(req);
            const search = req.query.q as string;

            if (!search || search.length < 2) {
                throw new Error('Минимум 2 символа');
            }

            const result = await this.contactService.searchUsers(userId, search);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}