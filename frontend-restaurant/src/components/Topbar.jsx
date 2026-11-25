import { useState, useEffect, useRef } from 'react';
import { Bell, User, Menu, ArrowLeft, Crown, Zap, Star, X, Loader2, AlertCircle, ArrowUpRight, Check, Store, QrCode, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { buildDummyUpiQrUrl, confirmDummyQRSubscriptionPayment } from '../utils/subscriptionClient';
/* ─── Plan styling helpers ───────────────────────────────────────── */
const PLAN_META = {
    Basic:        { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   ring: 'ring-blue-400',   grad: 'from-blue-500 to-blue-600',   icon: Zap   },
    Starter:      { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   ring: 'ring-blue-400',   grad: 'from-blue-500 to-blue-600',   icon: Zap   },
    Pro:          { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', ring: 'ring-purple-400', grad: 'from-purple-500 to-purple-600', icon: Star  },
    Professional: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', ring: 'ring-purple-400', grad: 'from-purple-500 to-purple-600', icon: Star  },
    Enterprise:   { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  ring: 'ring-amber-400',  grad: 'from-amber-500 to-amber-600',  icon: Crown },
};

const getPlanMeta = (name) => {
    if (!name) return null;
    return PLAN_META[name] ||
        Object.values(PLAN_META).find(m => m.icon && name.toLowerCase().includes(m.icon.displayName?.toLowerCase())) ||
        { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', ring: 'ring-gray-400', grad: 'from-gray-500 to-gray-600', icon: Star };
};

/* ─── Plan Upgrade Modal ────────────────────────────────────────── */
const PlanUpgradeModal = ({ currentPlan, plans, api, restaurant, setRestaurant, subscriptionState, onClose, onUpgraded }) => {
    const [subscribing, setSubscribing] = useState(null);
    const [qrPlan, setQrPlan] = useState(null);
    const modalRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const handleUpgradeClick = (planItem) => {
        if (subscriptionState?.isManualFrozen || restaurant?.subscription?.manualFreeze) {
            toast.error('This restaurant is administratively frozen. Please contact Support.');
            return;
        }
        if (subscriptionState?.isPendingApproval) {
            toast.error('Free trial request is pending Super Admin approval.');
            return;
        }
        const price = planItem.monthlyPrice || planItem.price || 0;
        const refId = `QR-UPG-${Date.now().toString().slice(-6)}`;
        setQrPlan({
            planItem,
            price,
            refId,
            qrImageUrl: buildDummyUpiQrUrl({ amount: price, label: `${planItem.name} Upgrade` })
        });
    };

    const handleConfirmQRUpgrade = async () => {
        if (!qrPlan?.planItem || subscribing) return;
        setSubscribing(qrPlan.planItem.name);
        try {
            await confirmDummyQRSubscriptionPayment({
                api,
                planName: qrPlan.planItem.name,
                billingCycle: 'monthly',
                refId: qrPlan.refId,
                onSuccess: (data) => {
                    setSubscribing(null);
                    onClose(); // Instantly close modal — no freezing or waiting
                    if (data?.restaurant && setRestaurant) {
                        setRestaurant(data.restaurant);
                        try { localStorage.setItem('restosys_restaurant', JSON.stringify(data.restaurant)); } catch (_) { }
                    }
                    if (onUpgraded) {
                        onUpgraded(qrPlan.planItem.name, data?.restaurant);
                    }
                },
                onFailure: () => {
                    setSubscribing(null);
                }
            });
        } catch {
            setSubscribing(null);
        }
    };

    const tierRank = (name = '') => {
        const lower = String(name).trim().toLowerCase();
        if (lower.includes('basic') || lower.includes('starter')) return 0;
        if (lower.includes('pro')) return 1;
        if (lower.includes('enterprise')) return 2;
        return 3;
    };

    const rawPlans = plans.length > 0 ? plans : [
        { _id: 'p1', name: 'Basic',      monthlyPrice: 2999,  features: ['1 Branch', 'Basic Reporting', 'Email Support'] },
        { _id: 'p2', name: 'Pro',        monthlyPrice: 5999,  features: ['3 Branches', 'Advanced Analytics', 'Priority Support'] },
        { _id: 'p3', name: 'Enterprise', monthlyPrice: 12999, features: ['Unlimited Branches', 'Custom Features', '24/7 Support'] },
    ];
    const displayPlans = [...rawPlans].sort((a, b) => tierRank(a.name) - tierRank(b.name));

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Upgrade Your Plan</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                                Current plan: <span className="font-bold text-gray-800 dark:text-slate-200">{currentPlan || 'None'}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1">
                    {qrPlan ? (
                        <div className="p-8 flex flex-col items-center text-center space-y-5">
                            <div className="p-4 bg-orange-50 dark:bg-orange-950/40 rounded-2xl border border-orange-200 dark:border-orange-900/50">
                                <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                                    <img src={qrPlan.qrImageUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    Scan &amp; Pay ₹{qrPlan.price.toLocaleString('en-IN')} for {qrPlan.planItem.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    Scan with any UPI app (GPay, PhonePe, Paytm) · Ref: {qrPlan.refId}
                                </p>
                            </div>
                            <div className="flex w-full max-w-sm gap-3">
                                <button
                                    type="button"
                                    onClick={() => setQrPlan(null)}
                                    disabled={subscribing !== null}
                                    className="w-1/3 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmQRUpgrade}
                                    disabled={subscribing !== null}
                                    className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                                >
                                    {subscribing ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-white shrink-0" />
                                            <span>Confirming Payment...</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2">
                                            <QrCode size={15} className="shrink-0" />
                                            <span>Confirm QR Payment</span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Plans grid */}
                            <div className="p-6 sm:p-8 pt-9 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                                {displayPlans.map((plan, idx) => {
                                    const meta  = getPlanMeta(plan.name);
                                    const Icon  = meta?.icon || Star;
                                    const price = plan.monthlyPrice || plan.price || 0;
                                    const isCurrent = plan.name === currentPlan;
                                    const isPopular = tierRank(plan.name) === 1;

                                    return (
                                        <div
                                            key={plan._id || idx}
                                            className={`relative rounded-2xl border-2 p-6 flex flex-col h-full transition-all
                                                ${isCurrent
                                                    ? `${meta?.border || 'border-gray-300 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800/60 shadow-sm`
                                                    : 'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-md bg-white dark:bg-slate-900'
                                                }
                                                ${isPopular && !isCurrent ? 'shadow-lg' : ''}
                                            `}
                                        >
                                            {/* Current / Popular badge */}
                                            {isCurrent ? (
                                                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${meta?.bg} ${meta?.text}`}>
                                                    Current Plan
                                                </div>
                                            ) : isPopular ? (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                                    Most Popular
                                                </div>
                                            ) : null}

                                            {/* Plan icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0 ${meta?.bg}`}>
                                                <Icon size={20} className={meta?.text} />
                                            </div>

                                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{plan.name}</h3>

                                            <div className="mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                                                <span className="text-3xl font-black text-gray-900 dark:text-white">₹{price.toLocaleString('en-IN')}</span>
                                                <span className="text-gray-400 dark:text-slate-500 text-sm">/mo</span>
                                            </div>

                                            <ul className="space-y-2.5 mb-6 flex-1">
                                                {(plan.features || []).map((f, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs font-medium text-gray-600 dark:text-slate-300 leading-snug">
                                                        <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                        <span>{f}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="mt-auto pt-2">
                                                {isCurrent ? (
                                                    <div className={`w-full py-2.5 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-1.5 ${meta?.bg} ${meta?.text}`}>
                                                        <Check size={15} /> Active Plan
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpgradeClick(plan)}
                                                        disabled={subscribing !== null}
                                                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap
                                                            bg-gradient-to-r ${meta?.grad} text-white shadow-md hover:opacity-90 hover:shadow-lg
                                                            disabled:opacity-50 disabled:cursor-not-allowed
                                                        `}
                                                    >
                                                        <ArrowUpRight size={14} /> Upgrade to {plan.name}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-center text-xs text-gray-400 pb-6 px-4">Instant UPI QR Scanner · Quick plan activation</p>
                        </>
                    )}
                    </div>
                </div>
            </div>
        </>
    );
};

/* ─── Topbar ────────────────────────────────────────────────────── */
const Topbar = () => {
    const { user, api, restaurant, setRestaurant, fetchRestaurant, subscriptionState, plans: cachedPlans, fetchPlans } = useAuth();
    const navigate = useNavigate();
    const [hasUnread, setHasUnread] = useState(false);
    const [plans, setPlans] = useState(cachedPlans || []);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    const subscriptionPlan = restaurant?.subscription?.plan || (restaurant ? 'Basic' : '');
    const subStatus = restaurant?.subscription?.status || 'Active';

    useEffect(() => {
        const handleThemeToggle = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('toggle-theme', handleThemeToggle);
        return () => window.removeEventListener('toggle-theme', handleThemeToggle);
    }, []);

    const handleToggleTheme = () => {
        const nextTheme = isDark ? 'light' : 'dark';
        try {
            localStorage.setItem('theme', nextTheme);
        } catch (_) {}
        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
        setIsDark(nextTheme === 'dark');
        window.dispatchEvent(new CustomEvent('toggle-theme'));
    };

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                if (Array.isArray(res.data)) {
                    const isManager = user?.role === 'BranchManager';
                    const isAdminUser = user?.role === 'RestaurantAdmin' || user?.role === 'Admin';
                    const userRole = user?.role || '';
                    const userBranchId = String(user?.branchId || '');

                    const hasRelevantUnread = res.data.some(n => {
                        if (n.read) return false;

                        // Check branch scoping if notification and manager have branchId
                        if (isManager && userBranchId && n.branchId && String(n.branchId) !== userBranchId) {
                            return false;
                        }

                        // Check target role scoping if specified
                        if (Array.isArray(n.targetRole) && n.targetRole.length > 0) {
                            const matchesRole = n.targetRole.includes(userRole) ||
                                n.targetRole.includes('All') ||
                                (isAdminUser && n.targetRole.includes('Admin')) ||
                                (isManager && (n.targetRole.includes('BranchManager') || n.targetRole.includes('Manager')));
                            if (!matchesRole) return false;
                        }

                        const title = (n.title || '').toLowerCase();
                        const type = (n.type || '').toLowerCase();

                        // Filter out routine kitchen / ready / served / preparation clutter for admin & manager
                        if (isAdminUser || isManager) {
                            if (type === 'kitchen' || title.includes('order ready') || title.includes('served') || title.includes('preparation') || title.includes('cashier counter')) {
                                return false;
                            }
                            if (n.metadata?.totalPrice && Number(n.metadata.totalPrice) < 1000) {
                                return false;
                            }
                        }

                        return true;
                    });
                    setHasUnread(hasRelevantUnread);
                } else {
                    setHasUnread(false);
                }
            } catch (error) {
                console.error('Failed to fetch notifications for topbar', error);
                setHasUnread(false);
            }
        };

        fetchNotifications();
        window.addEventListener('notifications-updated', fetchNotifications);
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => {
            window.removeEventListener('notifications-updated', fetchNotifications);
            clearInterval(intervalId);
        };
    }, [api, user]);

    // Fetch available plans + branches (restaurant subscription comes from AuthContext)
    useEffect(() => {
        const isBranchStaff = user?.role === 'RestaurantAdmin' || user?.role === 'Admin' || user?.role === 'BranchManager';
        if (!isBranchStaff) return;

        const fetchData = async () => {
            try {
                const [plansData, branchesRes] = await Promise.allSettled([
                    fetchPlans ? fetchPlans() : api.get('/plans').then(r => r.data || []),
                    api.get('/branches')
                ]);
                if (plansData.status === 'fulfilled' && plansData.value?.length > 0) {
                    setPlans(plansData.value);
                }
                if (branchesRes.status === 'fulfilled' && branchesRes.value.data?.length > 0) {
                    const branchList = branchesRes.value.data;
                    setBranches(branchList);
                    const matchingBranch = branchList.find(b => String(b._id) === String(user?.branchId));
                    setSelectedBranch(matchingBranch || branchList[0]);
                }
            } catch (error) {
                console.error('Failed to fetch topbar data', error);
            }
        };
        fetchData();
    }, [user?._id, user?.restaurantId, user?.branchId, api]);

    const meta   = getPlanMeta(subscriptionPlan);
    const Icon   = meta?.icon;
    const isAdmin = user?.role === 'RestaurantAdmin' || user?.role === 'Admin';

    return (
        <>
            <header className="h-16 sm:h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between px-3 sm:px-4 md:px-8 sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 w-full md:w-auto flex-1 min-w-0">
                    <button
                        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0 cursor-pointer"
                        aria-label="Toggle Sidebar Menu"
                        title="Toggle Sidebar"
                    >
                        <Menu size={22} />
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="md:hidden p-1.5 px-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs cursor-pointer"
                        aria-label="Go Back"
                        title="Back"
                    >
                        <ArrowLeft size={15} />
                        <span className="text-[11px] font-bold">Back</span>
                    </button>

                    {/* Branch Badge / Name display */}
                    {isAdmin && (
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs truncate">
                            <Store size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[100px] sm:max-w-[140px] md:max-w-[200px]">
                                {selectedBranch?.name ? selectedBranch.name : 'Main Branch'}
                            </span>
                            {branches.length > 1 ? (
                                <select 
                                    value={selectedBranch?._id || ''}
                                    onChange={(e) => setSelectedBranch(branches.find(b => b._id === e.target.value))}
                                    className="bg-transparent text-emerald-800 dark:text-emerald-300 font-bold text-xs outline-none cursor-pointer border-none pl-1"
                                >
                                    {branches.map(b => (
                                        <option key={b._id} value={b._id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold">{b.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <Link to="/admin/branches" className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md transition-colors ml-1 shrink-0">
                                    Branches
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 ml-2 md:ml-0 shrink-0">

                    {/* Dark / Light Theme Toggle */}
                    <button
                        type="button"
                        onClick={handleToggleTheme}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
                    </button>

                    {/* Notifications */}
                    <Link
                        to={
                            user?.role === 'SuperAdmin'       ? '/super-admin/notifications' :
                            isAdmin                            ? '/admin/notifications' :
                            user?.role === 'BranchManager'    ? '/manager/notifications' :
                            '/admin/notifications'
                        }
                        className="relative p-1.5 sm:p-2 text-gray-500 dark:text-slate-400 hover:text-green-500 transition-colors"
                    >
                        <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
                        {hasUnread && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                    </Link>

                    {/* Profile corner */}
                    <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-slate-800">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 capitalize">{user?.name || 'User'}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                {!isAdmin && (
                                    <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user?.role || 'Staff'}</p>
                                )}

                                {/* Plan badge — clickable for admins */}
                                {meta && isAdmin && (
                                    <>
                                        {subscriptionState?.isFrozen || ['Frozen', 'Expired', 'Cancelled', 'Inactive'].includes(subStatus) ? (
                                            <button
                                                onClick={() => setShowUpgradeModal(true)}
                                                title="Subscription Over! Click to renew plan"
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors animate-pulse cursor-pointer shadow-xs"
                                            >
                                                <AlertCircle size={10} className="text-red-600" />
                                                Subscription Over ({subStatus})
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowUpgradeModal(true)}
                                                title="Click to upgrade your plan"
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text} hover:opacity-80 transition-opacity cursor-pointer`}
                                            >
                                                {Icon && <Icon size={9} />}
                                                {subscriptionPlan}
                                                <ArrowUpRight size={8} className="opacity-60" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                            <div
                                onClick={() => isAdmin && meta && setShowUpgradeModal(true)}
                                className={`w-10 h-10 bg-green-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-green-600 dark:text-emerald-400 font-bold border border-green-200 dark:border-emerald-800 ${isAdmin && meta ? 'cursor-pointer hover:ring-2 ring-offset-1 ' + (meta.ring || 'ring-green-400') : ''} transition-all`}
                            >
                                <User size={20} />
                            </div>
                            {/* Tiny plan icon on avatar */}
                            {meta && Icon && isAdmin && (
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${meta.bg} border-2 border-white dark:border-slate-900 shadow-sm`}>
                                    <Icon size={9} className={meta.text} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Upgrade Modal */}
            {showUpgradeModal && isAdmin && (
                <PlanUpgradeModal
                    currentPlan={subscriptionPlan}
                    plans={plans}
                    api={api}
                    restaurant={restaurant}
                    setRestaurant={setRestaurant}
                    user={user}
                    subscriptionState={subscriptionState}
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgraded={(planName, freshRest) => {
                        if (freshRest && setRestaurant) {
                            setRestaurant(freshRest);
                        } else if (fetchRestaurant) {
                            fetchRestaurant().catch(() => {});
                        }
                    }}
                />
            )}
        </>
    );
};

export default Topbar;
