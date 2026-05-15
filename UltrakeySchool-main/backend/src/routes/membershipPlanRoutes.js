import express from 'express';
import membershipPlanController from '../controllers/membershipPlanController.js';
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = membershipPlanController;

const router = express.Router();

// Membership plan CRUD operations (TESTED & VERIFIED)
router.get('/', getAllPlans);  
router.get('/:id', getPlanById);  
router.post('/', createPlan);  
router.put('/:id', updatePlan);  
router.delete('/:id', deletePlan);  

export default router;
