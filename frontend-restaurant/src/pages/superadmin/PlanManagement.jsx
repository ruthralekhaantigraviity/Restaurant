import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, X, AlertCircle, TrendingUp, IndianRupee, CheckCircle2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const PlanManagement = () => {
    const { api } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: true
    });

    // Form state - now with monthlyPrice and yearlyPrice
    const [formData, setFormData] = useState({
        name: '',
        monthlyPrice: '',
        yearlyPrice: '',
        features: '',
        isActive: true
    });

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get('/super-admin/plans');
            setPlans(res.data);
        } catch (error) {
            console.error("Failed to fetch plans", error);
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [api]);

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                monthlyPrice: plan.monthlyPrice,
                yearlyPrice: plan.yearlyPrice,
                features: plan.features.join('\n'),
                isActive: plan.isActive
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                monthlyPrice: '',
                yearlyPrice: '',
                features: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // For price fields, only allow digits
        if (name === 'monthlyPrice' || name === 'yearlyPrice') {
            const numericOnly = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericOnly }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const featuresArray = formData.features
            .split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0);

        const payload = {
            name: formData.name,
            monthlyPrice: Number(formData.monthlyPrice),
            yearlyPrice: Number(formData.yearlyPrice),
            features: featuresArray,
            isActive: formData.isActive
        };

        try {
            if (editingPlan) {
                await api.put(`/super-admin/plans/${editingPlan._id}`, payload);
                toast.success('Plan updated successfully!');
            } else {
                await api.post('/super-admin/plans', payload);
                toast.success('Plan created successfully!');
            }
            fetchPlans();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save plan", error);
            toast.error(error.response?.data?.message || 'Failed to save plan');
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Plan',
            message: 'Are you sure you want to delete this plan? This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/super-admin/plans/${id}`);
                    toast.success('Plan deleted successfully!');
                    fetchPlans();
                } catch (error) {
                    console.error("Failed to delete plan", error);
                    toast.error(error.response?.data?.message || 'Failed to delete plan');
                }
            },
            isDestructive: true
        });
    };

    if (loading && plans.length === 0) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-sans">Subscription Plans</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Changes here will instantly reflect on the restaurant signup page.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-600/20 active:scale-95 text-xs font-bold"
                >
                    <Plus size={18} />
                    New Plan
                </button>
            </div>

            {/* Three Distinct Plan Sections for Maximum Visibility */}
            <div className="space-y-6">
                {plans.map((plan, index) => {
                    const isEnterprise = plan.name?.toLowerCase().includes('enterprise');
                    const isPro = plan.name?.toLowerCase().includes('pro');
                    const badgeClass = isEnterprise
                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                        : isPro
                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';

                    return (
                        <div
                            key={plan._id}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md"
                        >
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badgeClass}`}>
                                        Section {index + 1} • {plan.name} Tier
                                    </span>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${plan.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {plan.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenModal(plan)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-slate-700 cursor-pointer"
                                    >
                                        <Edit size={14} /> Edit Plan
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan._id)}
                                        className="p-1.5 text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 rounded-xl transition-all border border-red-100 dark:border-red-900/50 cursor-pointer"
                                        title="Delete Plan"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Section Body: Pricing & Features */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                                {/* Pricing Cards */}
                                <div className="lg:col-span-4 space-y-3">
                                    <h4 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Pricing Structure</h4>
                                    <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Monthly Billing</span>
                                            <div className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-0.5">
                                                ₹{(plan.monthlyPrice || 0).toLocaleString('en-IN')}
                                                <span className="text-xs font-normal text-blue-600 dark:text-blue-400">/mo</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                                            <IndianRupee size={20} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Yearly (Per Month)</span>
                                                {plan.monthlyPrice > 0 && plan.yearlyPrice > 0 && plan.yearlyPrice < plan.monthlyPrice && (
                                                    <span className="text-[10px] font-black bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                        Save {Math.round((1 - plan.yearlyPrice / plan.monthlyPrice) * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                                                ₹{(plan.yearlyPrice || 0).toLocaleString('en-IN')}
                                                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">/mo</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                                            <TrendingUp size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="lg:col-span-8 flex flex-col justify-start">
                                    <h4 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Included Capabilities & Modules</h4>
                                    {plan.features?.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {plan.features.map((feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/70 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300"
                                                >
                                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                    <span className="truncate">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 dark:text-slate-500 italic">No features specified for this plan.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {plans.length === 0 && !loading && (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-medium flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" />
                        No subscription plans found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="planForm" onSubmit={handleSubmit} className="space-y-5 min-w-0 pr-1.5 flex-1">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Plan Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. Starter, Professional"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Monthly Price (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                name="monthlyPrice"
                                                value={formData.monthlyPrice}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="2999"
                                                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Per month billing</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Yearly Price (₹/mo)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                name="yearlyPrice"
                                                value={formData.yearlyPrice}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="2399"
                                                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Per month when billed yearly</p>
                                    </div>
                                </div>

                                {formData.monthlyPrice && formData.yearlyPrice && (
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2 text-sm">
                                        <TrendingUp size={16} className="text-green-600 shrink-0" />
                                        <p className="text-green-700 font-medium">
                                            Yearly saves <strong>{Math.round((1 - Number(formData.yearlyPrice) / Number(formData.monthlyPrice)) * 100)}%</strong> vs monthly
                                            (₹{(Number(formData.monthlyPrice) - Number(formData.yearlyPrice)).toLocaleString('en-IN')}/mo savings)
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Features (One per line)</label>
                                    <textarea
                                        name="features"
                                        value={formData.features}
                                        onChange={handleInputChange}
                                        rows="5"
                                        placeholder={"1 Branch\nBasic Reporting\nEmail Support"}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                                    ></textarea>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <label htmlFor="isActive" className="text-sm font-bold text-gray-900 cursor-pointer">Active Plan</label>
                                        <p className="text-xs text-gray-500 mt-0.5">If unchecked, users cannot see or subscribe to this plan.</p>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="planForm"
                                className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                {editingPlan ? 'Save Changes' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                {...confirmModal}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div>
    );
};

export default PlanManagement;
