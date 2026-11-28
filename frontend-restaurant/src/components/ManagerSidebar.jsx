import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Store, ShoppingBag, UserCheck, PackageSearch, FileText, Settings, LogOut, UtensilsCrossed, ChefHat, MessageSquare, DollarSign, PieChart, QrCode, Truck, Bell, Receipt,
    CalendarDays, CreditCard, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/axiosInstance';

const ManagerSidebar = () => {
    const { logout, restaurant } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
        try {
            return localStorage.getItem('manager_sidebar_collapsed') === 'true';
        } catch (_) {
            return false;
        }
    });
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        setLogoError(false);
    }, [restaurant?.logo]);

    useEffect(() => {
        const handleToggle = () => {
            if (window.innerWidth < 768) {
                setIsOpen(prev => !prev);
            } else {
                setIsDesktopCollapsed(prev => {
                    const next = !prev;
                    try { localStorage.setItem('manager_sidebar_collapsed', String(next)); } catch (_) {}
                    return next;
                });
            }
        };
        window.addEventListener('toggle-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-sidebar', handleToggle);
    }, []);

    const getLogoUrl = () => {
        if (!restaurant?.logo) return null;
        if (restaurant.logo.startsWith('http') || restaurant.logo.startsWith('data:')) {
            return restaurant.logo;
        }
        const apiBase = getApiUrl();
        try {
            const origin = new URL(apiBase).origin;
            return `${origin}${restaurant.logo.startsWith('/') ? '' : '/'}${restaurant.logo}`;
        } catch (e) {
            return restaurant.logo;
        }
    };
    const logoSrc = getLogoUrl();

    const isItemActive = (itemPath) => {
        const currentTab = new URLSearchParams(location.search).get('tab') || 'shifts';
        if (itemPath === '/manager/staff') {
            return location.pathname === '/manager/staff' && (currentTab === 'shifts' || currentTab === 'monitoring' || currentTab === 'attendance');
        }
        if (itemPath === '/manager/staff?tab=leaves') {
            return location.pathname === '/manager/staff' && currentTab === 'leaves';
        }
        if (itemPath === '/manager/staff?tab=payroll') {
            return location.pathname === '/manager/staff' && currentTab === 'payroll';
        }
        if (itemPath === '/manager') {
            return location.pathname === '/manager' && (!location.search || location.search === '');
        }
        return location.pathname === itemPath;
    };

    const navGroups = [
        {
            title: 'Overview & Orders',
            items: [
                { name: 'Branch Overview', path: '/manager', icon: Store },
                { name: 'Daily Orders', path: '/manager/orders', icon: ShoppingBag },
                { name: 'Reservations', path: '/manager/reservations', icon: CalendarDays },
                { name: 'Table Status', path: '/manager/tables', icon: QrCode },
            ]
        },
        {
            title: 'Kitchen & Ops',
            items: [
                { name: 'Kitchen Status', path: '/manager/kitchen', icon: ChefHat },
                { name: 'Delivery Dispatch', path: '/manager/delivery', icon: Truck },
            ]
        },
        {
            title: 'Management',
            items: [
                { name: 'Billing Management', path: '/manager/billing-management', icon: Receipt },
                { name: 'Staff Monitoring', path: '/manager/staff', icon: UserCheck },
                { name: 'Leave Requests', path: '/manager/staff?tab=leaves', icon: CalendarDays },
                { name: 'Branch Payroll', path: '/manager/staff?tab=payroll', icon: CreditCard },
                { name: 'Inventory Status', path: '/manager/inventory', icon: PackageSearch },
                { name: 'Expense Tracking', path: '/manager/expenses', icon: DollarSign },
            ]
        },
        {
            title: 'Feedback & Analytics',
            items: [
                { name: 'Customer Feedback', path: '/manager/feedback', icon: MessageSquare },
                { name: 'Sales Overview', path: '/manager/sales', icon: CreditCard },
                { name: 'Branch Analytics', path: '/manager/analytics', icon: PieChart },
                { name: 'Reports', path: '/manager/reports', icon: FileText },
            ]
        },
        {
            title: 'System',
            items: [
                { name: 'Notifications', path: '/manager/notifications', icon: Bell },
                { name: 'Settings', path: '/manager/settings', icon: Settings },
            ]
        }
    ];

    return (
        <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 md:hidden" 
                onClick={() => setIsOpen(false)}
            />
        )}
        <aside className={clsx(
            "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-all duration-300 z-50 border-r border-slate-200 dark:border-slate-800",
            isDesktopCollapsed ? "md:-translate-x-full md:w-0 md:opacity-0 md:pointer-events-none md:overflow-hidden" : "md:translate-x-0 md:w-64",
            isOpen ? "translate-x-0 w-64" : "-translate-x-full"
        )}>
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {logoSrc && !logoError ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <img 
                                src={logoSrc} 
                                alt="Logo" 
                                onError={() => setLogoError(true)}
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    ) : (
                        <div className="bg-indigo-600 text-white p-2 rounded-xl shrink-0 shadow-sm">
                            <UtensilsCrossed size={22} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {restaurant && restaurant.name ? restaurant.name : 'FoodNest'}<span className="text-indigo-600 dark:text-indigo-400">Mgr</span>
                        </h1>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">Branch Manager</span>
                    </div>
                </div>

                {/* Mobile Close Button */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                    aria-label="Close Sidebar"
                >
                    ✕
                </button>
            </div>
            
            {/* Scrollable Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {navGroups.map((group, index) => (
                    <div key={index} className="mb-5">
                        <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {group.title}
                        </h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={clsx(
                                            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group",
                                            isItemActive(item.path)
                                            ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs font-semibold" 
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <Icon size={17} className={clsx("transition-transform group-hover:scale-110 shrink-0", isItemActive(item.path) ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200")} />
                                        <span className="text-[13px] leading-snug truncate min-w-0 flex-1">{item.name}</span>
                                        {isItemActive(item.path) && <ChevronRight size={14} className="ml-auto shrink-0 opacity-80" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <div className="px-3 py-2 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{restaurant?.name || 'Branch Manager'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Branch Operations</p>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200/70 dark:border-rose-900/50 transition-all text-sm cursor-pointer"
                >
                    <LogOut size={17} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default ManagerSidebar;