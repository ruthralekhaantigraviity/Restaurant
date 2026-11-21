import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getPublicCustomerReviews,
    getMyCustomerReviews,
    submitCustomerReview,
    deleteCustomerReview,
    getAdminCustomerReviews,
    updateCustomerReviewStatus
} from '../controllers/customerReviewController.js';

const router = express.Router();

// Public endpoint for customer landing page (strictly approved only)
router.get('/public', getPublicCustomerReviews);

// Customer endpoints
router.get('/mine', protect, getMyCustomerReviews);
router.post('/', protect, submitCustomerReview);
router.delete('/:id', protect, deleteCustomerReview);

// Admin / Manager Moderation endpoints
router.get('/admin/all', protect, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'Manager'), getAdminCustomerReviews);
router.put('/admin/:id/status', protect, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'Manager'), updateCustomerReviewStatus);

export default router;
