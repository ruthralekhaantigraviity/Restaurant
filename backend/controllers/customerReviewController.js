import CustomerReview from '../models/CustomerReview.js';

// @desc    Get all approved customer reviews for public landing page
// @route   GET /api/customer-reviews/public
// @access  Public
export const getPublicCustomerReviews = async (req, res) => {
    try {
        const reviews = await CustomerReview.find({ status: 'Approved' })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching public customer reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customer reviews' });
    }
};

// @desc    Get customer's own submitted reviews
// @route   GET /api/customer-reviews/mine
// @access  Private (Customer)
export const getMyCustomerReviews = async (req, res) => {
    try {
        const userId = req.user._id;
        const reviews = await CustomerReview.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your reviews' });
    }
};

// @desc    Submit or update a customer review
// @route   POST /api/customer-reviews
// @access  Private (Customer)
export const submitCustomerReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { rating, reviewText, orderId } = req.body;

        if (!reviewText || !reviewText.trim()) {
            return res.status(400).json({ success: false, message: 'Review text is required' });
        }

        const numRating = Number(rating) || 5;
        if (numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const customerName = req.user.name || 'Foodie Customer';
        const customerEmail = req.user.email || '';
        const avatar = req.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=FF5A1F&color=fff`;

        const newReview = await CustomerReview.create({
            userId,
            customerName,
            customerEmail,
            avatar,
            rating: numRating,
            reviewText: reviewText.trim(),
            orderId: orderId || null,
            status: 'Pending' // Requires admin / manager approval before appearing on landing page
        });

        res.status(201).json({
            success: true,
            message: 'Your review has been submitted and will appear on the landing page once approved by the admin or manager.',
            data: newReview
        });
    } catch (error) {
        console.error('Error submitting customer review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
};

// @desc    Admin/Manager: Get all customer reviews with status filter
// @route   GET /api/customer-reviews/admin/all
// @access  Private (SuperAdmin / Admin / RestaurantAdmin / Manager)
export const getAdminCustomerReviews = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        const reviews = await CustomerReview.find(filter)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching admin customer reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve customer reviews' });
    }
};

// @desc    Admin/Manager: Approve or Reject a customer review
// @route   PUT /api/customer-reviews/admin/:id/status
// @access  Private (SuperAdmin / Admin / RestaurantAdmin / Manager)
export const updateCustomerReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason, rating } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Approved, or Rejected.'
            });
        }

        const review = await CustomerReview.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.'
            });
        }

        review.status = status;
        if (rating !== undefined && Number(rating) >= 1 && Number(rating) <= 5) {
            review.rating = Number(rating);
        }

        if (status === 'Approved') {
            review.approvedAt = new Date();
            review.approvedBy = req.user._id;
            review.rejectionReason = '';
        } else if (status === 'Rejected') {
            review.rejectionReason = rejectionReason || 'Content did not meet editorial guidelines.';
            review.approvedBy = req.user._id;
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: `Review successfully marked as ${status}.`,
            data: review
        });
    } catch (error) {
        console.error('Error updating customer review status:', error);
        res.status(500).json({ success: false, message: 'Failed to update review status' });
    }
};

// @desc    Delete a customer review
// @route   DELETE /api/customer-reviews/:id
// @access  Private (Customer / Admin / Manager)
export const deleteCustomerReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await CustomerReview.findById(id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Allow owner of review or SuperAdmin/Admin/Manager
        const isOwner = review.userId.toString() === req.user._id.toString();
        const isAdminOrManager = ['SuperAdmin', 'Admin', 'RestaurantAdmin', 'Manager'].includes(req.user.role);

        if (!isOwner && !isAdminOrManager) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        }

        await CustomerReview.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};
