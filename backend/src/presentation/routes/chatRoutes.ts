import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { ChatController } from '../controllers/chat/ChatController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = express.Router();
const container = Container.getInstance();
const chatController = new ChatController(container);

const chatAuth = [authMiddleware(container), roleMiddleware(['patient', 'doctor'])];

router.post('/', chatAuth, chatController.sendMessage.bind(chatController));
router.get('/inbox', chatAuth, chatController.getInbox.bind(chatController));
router.get('/:receiverId', chatAuth, chatController.getMessages.bind(chatController));
router.delete('/:messageId', chatAuth, chatController.deleteMessage.bind(chatController));
router.get('/', chatAuth, chatController.getChatHistory.bind(chatController));

export default router;
