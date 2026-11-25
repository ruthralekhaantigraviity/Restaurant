import { useState, useEffect } from 'react';
import { Search, Plus, ShieldAlert, Edit2, Trash2, X, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const TaxManagement = () => {
    const { api } = useAuth();
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        rate: '',
        type: 'Percentage',
        appliesTo: 'All Items',
        isActive: true
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });


    const fetchData = async () => {
        try {
            const res = await api.get('/taxes');
            setTaxes(res.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Tax Rule',
            message: 'Are you sure you want to delete this tax rule?',
            onConfirm: async () => {
                try {
                    await api.delete(`/taxes/${id}`);
                    fetchData();
                    toast.success('Tax rule deleted successfully');
                } catch (error) {
                    console.error('Failed to delete tax', error);
                    toast.error('Failed to delete tax rule');
                }
            },
            isDestructive: true
        });
    };

    const handleToggleActive = async (tax) => {
        try {
            await api.put(`/taxes/${tax._id}`, { isActive: !tax.isActive });
            fetchData();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleEditClick = (tax) => {
        setEditingTax(tax._id);
        setFormData({
            name: tax.name,
            rate: tax.rate,
            type: tax.type,
            appliesTo: tax.appliesTo,
            isActive: tax.isActive
        });
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingTax(null);
        setFormData({
            name: '',
            rate: '',
            type: 'Percentage',
            appliesTo: 'All Items',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, rate: Number(formData.rate) };

            if (editingTax) {
                await api.put(`/taxes/${editingTax}`, payload);
            } else {
                await api.post('/taxes', payload);
            }
            fetchData();
            setIsModalOpen(false);
            toast.success(editingTax ? 'Tax rule updated' : 'Tax rule created');
        } catch (error) {
            console.error('Failed to save tax', error);
            toast.error(error.response?.data?.message || 'Failed to save tax rule');
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans relative">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Tax Configuration</h2>
                    <p className="text-gray-500 text-sm mt-1 dark:text-slate-400">Manage tax brackets, GST, VAT, and dynamic surcharges.</p>
                </div>
                <button 
                    onClick={handleAddClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md shadow-green-900/10"
                >
                    <Plus size={18} /> Add Tax Rule
                </button>
            </div>

            {/* Alert */}
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5 flex items-start gap-3 shadow-sm mb-8">
                <ShieldAlert size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">Tax Compliance Warning</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-1 leading-relaxed">
                        Ensure your tax rates comply with local regulations. Changes made here will immediately apply to all new orders across all active branches.
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100 dark:bg-slate-950 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">Tax/Charge Name</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">Rate</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">Type</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">Applies To</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center dark:text-slate-400">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : taxes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500 dark:text-slate-400">No tax rules found.</td>
                                </tr>
                            ) : taxes.map(tax => (
                                <tr key={tax._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-gray-900 text-sm dark:text-white">{tax.name}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-gray-900 text-sm dark:text-white">
                                            {tax.type === 'Percentage' ? `${tax.rate}%` : `₹${tax.rate.toFixed(2)}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{tax.type}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-3 py-1 rounded-md text-xs font-bold tracking-wide">
                                            {tax.appliesTo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button 
                                            onClick={() => handleToggleActive(tax)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                                                tax.isActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span 
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tax.isActive ? 'translate-x-6' : 'translate-x-1'}`} 
                                            />
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 transition-opacity">
                                            <button 
                                                onClick={() => handleEditClick(tax)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(tax._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] dark:bg-slate-900">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 text-lg dark:text-white">{editingTax ? 'Edit Tax Rule' : 'New Tax Rule'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="tax-form" onSubmit={handleSubmit} className="space-y-5 min-w-0 pr-1.5 flex-1">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 dark:text-slate-200">Tax/Charge Name <span className="text-red-500 font-bold ml-0.5">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium dark:bg-slate-950 dark:border-slate-800"
                                        placeholder="e.g. State Sales Tax (GST)"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 dark:text-slate-200">Type</label>
                                        <select 
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium dark:bg-slate-950 dark:border-slate-800"
                                        >
                                            <option value="Percentage">Percentage (%)</option>
                                            <option value="Fixed Amount">Fixed Amount ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 dark:text-slate-200">Rate <span className="text-red-500 font-bold ml-0.5">*</span></label>
                                        <div className="relative">
                                            {formData.type === 'Fixed Amount' && <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
                                            <input 
                                                type="number" 
                                                min="0"
                                                step="any"
                                                required
                                                value={formData.rate}
                                                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                                                className={`w-full ${formData.type === 'Fixed Amount' ? 'pl-9' : 'pl-4'} ${formData.type === 'Percentage' ? 'pr-8' : 'pr-4'} py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-bold`}
                                                placeholder="0.00"
                                            />
                                            {formData.type === 'Percentage' && <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 dark:text-slate-200">Applies To</label>
                                    <select 
                                        value={formData.appliesTo}
                                        onChange={(e) => setFormData({...formData, appliesTo: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium dark:bg-slate-950 dark:border-slate-800"
                                    >
                                        <option value="All Items">All Items</option>
                                        <option value="Dine-In Only">Dine-In Only</option>
                                        <option value="Delivery Only">Delivery Only</option>
                                        <option value="Takeaway Only">Takeaway Only</option>
                                        <option value="Beverages Category">Beverages Category</option>
                                        <option value="Food Category">Food Category</option>
                                        <option value="Alcohol">Alcohol</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">Specify which items or order types this charge applies to.</p>
                                </div>
                                
                                <div className="flex items-center gap-3 pt-2">
                                    <label className="relative flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                    <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer dark:text-slate-200">
                                        Tax Rule is Active
                                    </label>
                                </div>
                                
                                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0 mt-8 -mx-6 -mb-6 dark:border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                    >
                                        {editingTax ? 'Save Changes' : 'Add Tax Rule'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxManagement;
