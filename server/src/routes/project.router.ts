import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {ProjectController} from "../controllers/project.controller";

const router = Router();
const projectController = new ProjectController();

router.post('/', authMiddleware, projectController.createProject.bind(projectController));
router.put('/:id', authMiddleware, projectController.updateProject.bind(projectController));
router.delete('/:id', authMiddleware, projectController.deleteProject.bind(projectController));
router.get('/:id', authMiddleware, projectController.getProject.bind(projectController));
router.get('/', authMiddleware, projectController.getUserProjects.bind(projectController));

router.post('/:id/members', authMiddleware, projectController.addMembers.bind(projectController));
router.delete('/:id/members/:memberId', authMiddleware, projectController.removeMember.bind(projectController));
router.put('/:id/members/:memberId/role', authMiddleware, projectController.updateMemberRole.bind(projectController));
router.get('/:id/members', authMiddleware, projectController.getProjectMembers.bind(projectController));

router.get('/:id/contacts/search', authMiddleware, projectController.searchContactsForProject.bind(projectController));

export const projectRouter = router;