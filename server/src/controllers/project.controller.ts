import { Request, Response } from "express";
import {ProjectService} from "../services/project.service";

export class ProjectController {
    private projectService: ProjectService;

    constructor() {
        this.projectService = new ProjectService();
    }

    async createProject(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const result = await this.projectService.createProject(userId, req.body);

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

    async updateProject(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);

            if (isNaN(projectId)) {
                throw new Error('Некорректный ID проекта');
            }

            const result = await this.projectService.updateProject(userId, projectId, req.body);

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

    async deleteProject(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);

            if (isNaN(projectId)) {
                throw new Error('Некорректный ID проекта');
            }

            await this.projectService.deleteProject(userId, projectId);

            res.json({
                success: true,
                message: 'Проект удален'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getProject(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);

            if (isNaN(projectId)) {
                throw new Error('Некорректный ID проекта');
            }

            const result = await this.projectService.getProject(userId, projectId);

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

    async getUserProjects(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const result = await this.projectService.getUserProjects(userId);

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

    async addMembers(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);

            if (isNaN(projectId)) {
                throw new Error('Некорректный ID проекта');
            }

            const result = await this.projectService.addMembers(userId, projectId, req.body);

            res.json({
                success: true,
                data: result,
                message: 'Участники добавлены'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async removeMember(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);
            const memberId = parseInt(req.params.memberId);

            if (isNaN(projectId) || isNaN(memberId)) {
                throw new Error('Некорректный ID');
            }

            await this.projectService.removeMember(userId, projectId, memberId);

            res.json({
                success: true,
                message: 'Участник удален из проекта'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateMemberRole(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);
            const memberId = parseInt(req.params.memberId);
            const { role } = req.body;

            if (isNaN(projectId) || isNaN(memberId)) {
                throw new Error('Некорректный ID');
            }

            if (!role) {
                throw new Error('Роль не указана');
            }

            await this.projectService.updateMemberRole(userId, projectId, memberId, role);

            res.json({
                success: true,
                message: 'Роль участника обновлена'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getProjectMembers(req: Request, res: Response) {
        try {
            const projectId = parseInt(req.params.id);

            if (isNaN(projectId)) {
                throw new Error('Некорректный ID проекта');
            }

            const result = await this.projectService.getProjectMembers(projectId);

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

    async searchContactsForProject(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);
            const search = req.query.q as string;

            if (isNaN(projectId)) {
                throw new Error('Некорректный ID проекта');
            }

            if (!search || search.length < 2) {
                throw new Error('Минимум 2 символа для поиска');
            }

            const result = await this.projectService.searchContactsForProject(userId, projectId, search);

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