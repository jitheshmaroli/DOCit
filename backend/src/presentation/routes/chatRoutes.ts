import express from 'express';
import createControllers from '../../infrastructure/di/controllers';
import createMiddlewares from '../../infrastructure/di/middlewares';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const { chatController } = createControllers();
const { authMiddleware, chatRoleMiddleware } = createMiddlewares();

const chatAuth = [authMiddleware.exec, chatRoleMiddleware.exec];

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
