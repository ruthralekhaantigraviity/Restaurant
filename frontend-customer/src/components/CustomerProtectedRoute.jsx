import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const CustomerProtectedRoute = ({ children }) => {
    const auth = useCustomerAuth() || {};
    const user = auth.user;
    const loading = auth.loading;
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Redirect to customer login but save the attempted url
                navigate('/customer/login', { state: { from: location }, replace: true });
            } else if (user.role !== 'Customer') {
                navigate('/customer/login', { replace: true });
            }
        }
    }, [user, loading, location, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user || user.role !== 'Customer') {
        return null;
    }

    return children;
};

export default CustomerProtectedRoute;
