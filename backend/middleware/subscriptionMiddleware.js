import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';
import { evaluateSubscriptionAccess } from '../utils/subscriptionHelper.js';
import { getCachedRestaurant } from './authMiddleware.js';

// Fast in-memory cache for subscription access verdicts (60s TTL)
const verdictCache = new Map();

export const invalidateSubscriptionCache = (restaurantId) => {
    if (restaurantId) verdictCache.delete(String(restaurantId));
};

/**
 * Middleware to strictly enforce subscription status and dashboard freeze.
 * Must run AFTER `protect` so `req.user` is populated.
 * Bypassed for SuperAdmin, SupportAgent, Customer roles, demo restaurants,
 * and essential billing/verification/support/notification endpoints.
 */
export const checkSubscriptionAccess = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next();

        // 1. SuperAdmin, SupportAgent, and Customers are not restricted by restaurant subscriptions
        if (['SuperAdmin', 'SupportAgent', 'Customer'].includes(user.role)) {
            return next();
        }

        // 2. Allow essential billing, payment, verification, support, auth & notification routes
        const url = req.originalUrl || '';
        if (
            url.includes('/razorpay') ||
            url.includes('/trial-request') ||
            url.includes('/verification') ||
            url.includes('/support') ||
            url.includes('/notifications') ||
            url.includes('/plans') ||
            url.includes('/auth') ||
            (req.method === 'GET' && url.includes('/restaurants/mine'))
        ) {
            return next();
        }

        // 3. Resolve restaurant ID (directly or from branchId)
        let restaurantId = user.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id'];
        if (!restaurantId && user.branchId) {
            const branchDoc = await Branch.findById(user.branchId).select('restaurantId').lean();
            if (branchDoc) restaurantId = branchDoc.restaurantId;
        }
        if (!restaurantId) {
            return next();
        }

        const restKey = String(restaurantId);
        const cached = verdictCache.get(restKey);
        if (cached && (Date.now() - cached.timestamp < 60000)) {
            if (cached.verdict.isFrozen) {
                return res.status(403).json(cached.verdict);
            }
            if (cached.restaurant) {
                req.restaurant = cached.restaurant;
            }
            return next();
        }

        const restaurant = req.restaurant || await getCachedRestaurant(restaurantId);
        if (!restaurant) {
            return next();
        }

        req.restaurant = restaurant;

        const verdict = await evaluateSubscriptionAccess(restaurant, { notifyOnExpire: false });
        verdictCache.set(restKey, { verdict, restaurant, timestamp: Date.now() });

        if (verdict.isFrozen) {
            return res.status(403).json(verdict);
        }

        next();
    } catch (error) {
        console.error('[Subscription Middleware Error]:', error.message);
        next();
    }
};
