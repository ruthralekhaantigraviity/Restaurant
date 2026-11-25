import { Outlet } from 'react-router-dom';
import ChefSidebar from '../components/ChefSidebar';
import ChefTopbar from '../components/ChefTopbar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';

import SubscriptionFreezeOverlay from '../components/SubscriptionFreezeOverlay';

const ChefLayout = () => {
    const { user, restaurant, subscriptionState, fetchRestaurant } = useAuth();
    const isFrozen = Boolean(subscriptionState?.isFrozen);

    const isApproved = restaurant?.approvalStatus === 'Approved' && restaurant?.subscription?.status !== 'Pending Approval';
    const isUnverified = user?.role !== 'SuperAdmin' && Boolean(
        restaurant && (
            !isApproved || 
            restaurant.approvalStatus === 'Pending' || 
            restaurant.approvalStatus === 'Rejected' || 
            restaurant.subscription?.status === 'Pending Approval' || 
            restaurant.verificationStatus === 'Rejected' || 
            restaurant.verificationStatus === 'Re-upload Required'
        )
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors">
            <SubscriptionBanner />
            <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <ChefSidebar />
            
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                <ChefTopbar />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-2.5 sm:p-4 md:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <div className="max-w-[1920px] mx-auto w-full">
                        {isFrozen ? (
                            <SubscriptionFreezeOverlay onUnfrozen={() => fetchRestaurant()} />
                        ) : isUnverified ? (
                            <div className="text-gray-900 dark:text-slate-100">
                                <VerificationBlockedOverlay />
                            </div>
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </main>
            </div>
            </div>
        </div>
    );
};

export default ChefLayout;
