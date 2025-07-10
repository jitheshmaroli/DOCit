import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { ChatController } from '../controllers/chat/ChatController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import multer from 'multer';

const router = express.Router();
const container = Container.getInstance();
const chatController = new ChatController(container);
const upload = multer({ dest: 'uploads/' });

const chatAuth = [authMiddleware(container), roleMiddleware(['patient', 'doctor'])];

router.post('/', chatAuth, chatController.sendMessage.bind(chatController));
router.post('/attachment', chatAuth, upload.single('file'), chatController.sendAttachment.bind(chatController));
router.get('/inbox', chatAuth, chatController.getInbox.bind(chatController));
router.get('/:receiverId', chatAuth, chatController.getMessages.bind(chatController));
router.delete('/:messageId', chatAuth, chatController.deleteMessage.bind(chatController));
router.patch('/:messageId/read', chatAuth, chatController.markAsRead.bind(chatController));
router.patch('/:messageId/reaction', chatAuth, chatController.addReaction.bind(chatController));
router.get('/', chatAuth, chatController.getChatHistory.bind(chatController));
router.get('/status/:targetUserId/:targetRole', chatAuth, chatController.getUserStatus.bind(chatController));
export default router;
