const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// 公开路由
router.post('/register', authController.getRegisterValidators(), authController.register);
router.post('/login', authController.getLoginValidators(), authController.login);

// 需要认证的路由
router.use(authMiddleware);

router.get('/me', authController.getUserInfo);
router.put('/me', authController.updateUserInfo);
router.put('/password', authController.changePassword);
router.post('/logout', authController.logout);
router.delete('/delete', authController.deleteAccount);

module.exports = router;