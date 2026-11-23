import { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Phone, Mail, ExternalLink, Edit2, Trash2, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { filterIndianMobile } from '../../utils/phoneValidator';

const SupplierManagement = () => {
    const { api, restaurant } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Vegetables & Fruits',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        branch: '',
        isActive: true
    });

    const effectiveBranches = (branches && branches.length > 0)
        ? branches
        : [{ _id: restaurant?._id || 'main', name: restaurant?.name ? `${restaurant.name} Main Branch` : 'Main Outlet' }];

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });


    const fetchData = async () => {
        try {
            const [suppRes, branchesRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/branches')
            ]);
            // Deduplicate suppliers by lowercase name to ensure no repeats are shown
            const seen = new Set();
            const uniqueSuppliers = (suppRes.data || []).filter(s => {
                const key = (s.name || '').trim().toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            setSuppliers(uniqueSuppliers);
            const branchList = branchesRes.data || [];
            setBranches(branchList);
            
            if (branchList.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    branch: prev.branch && branchList.some(b => b._id === prev.branch) ? prev.branch : branchList[0]._id
                }));
            }
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
            title: 'Remove Supplier',
            message: 'Are you sure you want to remove this supplier?',
            onConfirm: async () => {
                try {
                    await api.delete(`/suppliers/${id}`);
                    fetchData();
                    toast.success('Supplier removed successfully');
                } catch (error) {
                    console.error('Failed to delete supplier', error);
                    toast.error('Failed to delete supplier');
                }
            },
            isDestructive: true
        });
    };

    const handleEditClick = (supplier) => {
        setEditingSupplier(supplier._id);
        setFormData({
            name: supplier.name,
            category: supplier.category || 'General',
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone,
            email: supplier.email || '',
            address: supplier.address || '',
            branch: supplier.branch?._id || supplier.branch || '',
            isActive: supplier.isActive
        });
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingSupplier(null);
        const defaultBranchId = (branches && branches.length > 0) ? branches[0]._id : (effectiveBranches.length > 0 ? effectiveBranches[0]._id : '');
        setFormData({
            name: '',
            category: 'Vegetables & Fruits',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            branch: defaultBranchId,
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const digits = String(formData.phone || '').replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(digits)) {
            toast.error('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9.');
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            const payload = { ...formData, phone: digits };
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier}`, payload);
            } else {
                await api.post('/suppliers', payload);
            }
            await fetchData();
            setIsModalOpen(false);
            toast.success(editingSupplier ? 'Supplier updated' : 'Supplier added');
        } catch (error) {
            console.error('Failed to save supplier', error);
            toast.error(error.response?.data?.message || 'Failed to save supplier');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSuppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (supplier.category && supplier.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 font-sans relative text-slate-900 dark:text-slate-100">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Supplier Management</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Manage vendor details and purchase orders.</p>
                </div>
                <button 
                    onClick={handleAddClick}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md shadow-emerald-900/10 cursor-pointer"
                >
                    <Plus size={18} /> Add Supplier
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 items-center">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search suppliers by name or category..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" 
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-10 text-center text-gray-500 dark:text-slate-400">
                    No suppliers found. Click "+ Add Supplier" to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map(supplier => (
                        <div key={supplier._id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                            {/* Status Badge */}
                            <div className="absolute top-0 right-0 m-4 flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${supplier.isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60'}`}>
                                    {supplier.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            {/* Delete Button (Hover) */}
                            <div className="absolute top-4 right-20 transition-opacity">
                                <button 
                                    onClick={() => handleDelete(supplier._id)}
                                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Supplier"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mb-4 pr-12">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{supplier.name}</h3>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">{supplier.category}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {supplier.contactPerson && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                                        <div className="w-6 flex justify-center"><Search size={16} className="text-gray-400 dark:text-slate-500" /></div>
                                        <span>Contact: {supplier.contactPerson}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                                    <div className="w-6 flex justify-center"><Phone size={16} className="text-gray-400 dark:text-slate-500" /></div>
                                    <span>{supplier.phone}</span>
                                </div>
                                {supplier.email && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                                        <div className="w-6 flex justify-center"><Mail size={16} className="text-gray-400 dark:text-slate-500" /></div>
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                                        <div className="w-6 flex justify-center mt-0.5"><MapPin size={16} className="text-gray-400 dark:text-slate-500" /></div>
                                        <span className="line-clamp-2">{supplier.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => handleEditClick(supplier)}
                                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                                >
                                    <Edit2 size={15} />
                                    <span>Edit Details</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs" onClick={() => !submitting && setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 w-full max-w-xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
                            <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="supplier-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Supplier Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Category</label>
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                        >
                                            <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                                            <option value="Meat & Poultry">Meat & Poultry</option>
                                            <option value="Dairy Products">Dairy Products</option>
                                            <option value="Dry Goods">Dry Goods</option>
                                            <option value="Beverages">Beverages</option>
                                            <option value="Packaging & Supplies">Packaging & Supplies</option>
                                            <option value="General">General</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Contact Person</label>
                                        <input 
                                            type="text" 
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Phone Number *</label>
                                        <input 
                                            type="tel" 
                                            inputMode="numeric"
                                            maxLength={10}
                                            pattern="[6-9][0-9]{9}"
                                            placeholder="10-digit mobile (6-9)"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => {
                                                const clean = filterIndianMobile(e.target.value);
                                                if (e.target.value && !clean) toast.error('Mobile number must start with 6, 7, 8, or 9');
                                                setFormData({ ...formData, phone: clean });
                                            }}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Physical Address</label>
                                    <textarea 
                                        rows="2"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium resize-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Assign to Branch *</label>
                                    <select 
                                        value={formData.branch}
                                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                        required
                                    >
                                        {effectiveBranches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
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
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                    <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-slate-200 cursor-pointer">
                                        Active Supplier
                                    </label>
                                </div>
                                
                                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex gap-3 bg-gray-50/50 dark:bg-slate-800/50 shrink-0 mt-8 -mx-6 -mb-6">
                                    <button 
                                        type="button" 
                                        disabled={submitting}
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl transition-colors text-sm shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm shadow-emerald-600/20 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                        <span>{submitting ? 'Saving...' : (editingSupplier ? 'Save Changes' : 'Add Supplier')}</span>
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

export default SupplierManagement;
