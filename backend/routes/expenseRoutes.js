const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 更新单个节点费用
router.put('/nodes/:nodeId', expenseController.getUpdateExpenseValidators(), expenseController.updateNodeExpense);

// 批量更新计划中的节点费用
router.put('/plans/:planId/batch', expenseController.batchUpdateExpenses);

// 获取计划的费用统计
router.get('/plans/:planId/stats', expenseController.getPlanExpenseStats);

// 从语音识别结果中提取费用信息
router.post('/extract/audio', expenseController.extractExpenseFromAudio);

module.exports = router;