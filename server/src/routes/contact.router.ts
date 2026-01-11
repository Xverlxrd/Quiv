import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {ContactController} from "../controllers/contact.controller";

const router = Router();
const contactController = new ContactController();

router.post('/requests', authMiddleware, contactController.sendRequest.bind(contactController));

router.put('/requests/:id/accept', authMiddleware, contactController.acceptRequest.bind(contactController));

router.put('/requests/:id/reject', authMiddleware, contactController.rejectRequest.bind(contactController));

router.post('/block/:id', authMiddleware, contactController.blockUser.bind(contactController));

router.delete('/block/:id', authMiddleware, contactController.unblockUser.bind(contactController));

router.delete('/:id', authMiddleware, contactController.removeContact.bind(contactController));

router.get('/', authMiddleware, contactController.getContacts.bind(contactController));

router.get('/requests/incoming', authMiddleware, contactController.getIncomingRequests.bind(contactController));

router.get('/requests/outgoing', authMiddleware, contactController.getOutgoingRequests.bind(contactController));

router.get('/status/:id', authMiddleware, contactController.getContactStatus.bind(contactController));

router.get('/search', authMiddleware, contactController.searchUsers.bind(contactController));

export const contactRouter = router;