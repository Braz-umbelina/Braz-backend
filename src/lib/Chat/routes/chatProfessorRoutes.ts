import { Router } from 'express';
import { authMiddlewareProfessor } from '../../middlewares/professor/authProfessor.js';
import {
  storeChatProfessor,
  indexChatProfessor,
} from '../controller/chatController.js';

const router = Router();

router.use(authMiddlewareProfessor);

router.post('/', storeChatProfessor);

router.get('/historico', indexChatProfessor);

export default router;
