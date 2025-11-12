const express = require('express');
const travelPlanController = require('../controllers/travelPlanController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// 生成旅行计划（不保存到数据库）- 无需认证
// 支持两种路径：/generate 和 /travel-plans/generate
router.post('/generate', travelPlanController.getGeneratePlanValidators(), travelPlanController.generatePlan);
router.post('/travel-plans/generate', travelPlanController.getGeneratePlanValidators(), travelPlanController.generatePlan);

// 其他路由需要认证
router.use(authMiddleware);

// 保存旅行计划
router.post('/', travelPlanController.getSavePlanValidators(), travelPlanController.savePlan);

// 获取旅行计划列表
router.get('/', travelPlanController.getPlans);

// 获取旅行统计数据
router.get('/stats', travelPlanController.getPlanStats);
router.get('/stats/summary', travelPlanController.getPlanStats);

// 获取单个旅行计划详情
router.get('/:id', travelPlanController.getPlanDetail);

// 更新旅行计划
router.put('/:id', travelPlanController.updatePlan);

// 删除旅行计划
router.delete('/:id', travelPlanController.deletePlan);

module.exports = router;