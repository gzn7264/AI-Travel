import userService from './userService';
import travelPlanService from './travelPlanService';
import speechRecognitionService from './speechRecognitionService';

// API服务导出
export default {
  user: userService,
  travelPlan: travelPlanService,
  speechRecognition: speechRecognitionService
};

// 导出单独的服务
export { userService, travelPlanService, speechRecognitionService };