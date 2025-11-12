const express = require('express');
const travelPlanController = require('../controllers/travelPlanController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 生成旅行计划（不保存到数据库）
router.post('/generate', travelPlanController.getGeneratePlanValidators(), travelPlanController.generatePlan);

// 保存旅行计划
router.post('/', travelPlanController.getSavePlanValidators(), travelPlanController.savePlan);

// 获取旅行计划列表
router.get('/', travelPlanController.getPlans);

// 获取旅行统计数据
router.get('/stats', travelPlanController.getPlanStats);

// 获取单个旅行计划详情
router.get('/:id', travelPlanController.getPlanDetail);

// 更新旅行计划
router.put('/:id', travelPlanController.updatePlan);

// 删除旅行计划
router.delete('/:id', travelPlanController.deletePlan);

module.exports = router;