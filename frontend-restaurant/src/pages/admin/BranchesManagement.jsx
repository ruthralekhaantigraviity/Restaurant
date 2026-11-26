import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Phone, Edit2, Trash2, X, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { filterIndianMobile } from '../../utils/phoneValidator';

const BranchesManagement = () => {
    const { api, restaurant } = useAuth();
    const [branches, setBranches] = useState(() => {
        try {
            const cached = sessionStorage.getItem('restosys_branches_cache');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [loading, setLoading] = useState(() => !sessionStorage.getItem('restosys_branches_cache'));

    const planName = restaurant?.subscription?.plan || 'Basic';
    const maxBranches = (planName === 'Basic' || planName === 'Starter') ? 1 : (planName === 'Pro' || planName === 'Professional') ? 3 : 'Unlimited';
    
    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [branchToDelete, setBranchToDelete] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        isActive: true
    });

    const fetchBranches = async () => {
        try {
            const { data } = await api.get('/branches');
            const list = data || [];
            setBranches(list);
            try { sessionStorage.setItem('restosys_branches_cache', JSON.stringify(list)); } catch (_) {}
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const isLimitReached = typeof maxBranches === 'number' && branches.length >= maxBranches;

    const handleOpenModal = (branch = null) => {
        if (!branch && isLimitReached) {
            setIsUpgradeModalOpen(true);
            return;
        }
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                address: branch.location?.address || '',
                phone: branch.contact?.phone || '',
                isActive: branch.isActive
            });
        } else {
            setEditingBranch(null);
            setFormData({ name: '', address: '', phone: '', isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            name: formData.name,
            location: { address: formData.address },
            contact: { phone: formData.phone },
            isActive: formData.isActive
        };

        try {
            if (editingBranch) {
                await api.put(`/branches/${editingBranch._id}`, payload);
                toast.success('Branch updated successfully');
            } else {
                await api.post('/branches', payload);
                toast.success('Branch created successfully');
            }
            fetchBranches();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save branch', error);
            const errMsg = error.response?.data?.message || 'Error saving branch';
            toast.error(errMsg);
        }
    };

    const handleDeleteClick = (branch) => {
        setBranchToDelete(branch);
    };

    const confirmDelete = async () => {
        if (!branchToDelete) return;
        try {
            await api.delete(`/branches/${branchToDelete._id}`);
            toast.success('Branch deleted successfully');
            fetchBranches();
        } catch (error) {
            console.error('Failed to delete branch', error);
            toast.error('Error deleting branch');
        } finally {
            setBranchToDelete(null);
        }
    };

    const filteredBranches = branches.filter(branch => {
        const matchesSearch = !searchQuery || branch.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All Statuses' || 
                              (statusFilter === 'Active' && branch.isActive) || 
                              (statusFilter === 'Inactive' && !branch.isActive);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>Branches</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                        Manage your restaurant locations ({branches.length} / {maxBranches} branch{maxBranches === 1 ? '' : 'es'} used on <span className="font-semibold text-blue-600 dark:text-blue-400">{planName}</span> plan).
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-sm shadow-blue-500/10 cursor-pointer"
                >
                    <Plus size={18} /> Add Branch
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search branches..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    >
                        <option value="All Statuses">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Branch Grid */}
            {loading ? (
                <div className="flex justify-center p-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <p className="text-gray-500 dark:text-slate-400">No branches found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map(branch => (
                        <div key={branch._id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between h-full">
                            <div className="p-5 border-b border-gray-50 dark:border-slate-800 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${branch.isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>{branch.name}</h3>
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 border ${branch.isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${branch.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                {branch.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mt-4 text-sm text-gray-500 dark:text-slate-400">
                                    <p className="flex items-center gap-2"><MapPin size={14} className="text-blue-500 dark:text-blue-400 shrink-0" /> <span className="line-clamp-1">{branch.location?.address || 'No address specified'}</span></p>
                                    <p className="flex items-center gap-2"><Phone size={14} className="text-blue-500 dark:text-blue-400 shrink-0" /> <span>{branch.contact?.phone || 'No phone'}</span></p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50/50 dark:bg-slate-800/50 p-4 px-5 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-0.5">Manager</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{branch.manager?.name || 'Unassigned'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-0.5">Monthly Rev</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'Manrope, sans-serif' }}>₹0</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-white dark:bg-slate-900 px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => handleOpenModal(branch)}
                                    className="px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900/60 transition-colors cursor-pointer"
                                >
                                    <Edit2 size={13} /> Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(branch)}
                                    className="px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer shadow-2xs"
                                >
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 dark:bg-slate-950/70 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Branch Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. Downtown Main"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Address</label>
                                <input 
                                    type="text" 
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="Full address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone Number</label>
                                <input 
                                    type="tel" 
                                    inputMode="numeric"
                                    maxLength={10}
                                    pattern="[6-9][0-9]{9}"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const clean = filterIndianMobile(e.target.value);
                                        if (e.target.value && !clean) toast.error('Mobile number must start with 6, 7, 8, or 9');
                                        setFormData({...formData, phone: clean});
                                    }}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="9876543210"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-4 h-4 text-green-600 border-gray-300 dark:border-slate-700 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer">
                                    Branch is Active
                                </label>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-colors text-sm cursor-pointer"
                                >
                                    {editingBranch ? 'Save Changes' : 'Create Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {branchToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 dark:bg-slate-950/70 backdrop-blur-sm" onClick={() => setBranchToDelete(null)}></div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-xl mb-2">Delete Branch?</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                                Are you sure you want to delete <strong>{branchToDelete.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setBranchToDelete(null)}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm shadow-red-600/20 transition-colors text-sm"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Subscription Modal */}
            {isUpgradeModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUpgradeModalOpen(false)}></div>
                    <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl border border-white/50 max-w-md w-full text-center flex flex-col items-center gap-5 relative z-10 animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsUpgradeModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
                            <Sparkles size={28} />
                        </div>

                        <div className="space-y-2 min-w-0 pr-1.5 flex-1">
                            <h3 className="text-xl font-black text-slate-900">Branch Limit Reached</h3>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                Your current <strong>{planName}</strong> plan allows up to <strong>{maxBranches} branch{maxBranches === 1 ? '' : 'es'}</strong>. Upgrade your subscription to create more locations.
                            </p>
                        </div>

                        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 text-xs">
                            <div className="flex justify-between items-center font-semibold text-slate-600">
                                <span>Basic Plan:</span>
                                <span className="font-bold text-slate-900">1 Branch</span>
                            </div>
                            <div className="flex justify-between items-center font-semibold text-slate-600">
                                <span>Pro Plan:</span>
                                <span className="font-bold text-indigo-600">Up to 3 Branches</span>
                            </div>
                            <div className="flex justify-between items-center font-semibold text-slate-600">
                                <span>Enterprise Plan:</span>
                                <span className="font-bold text-purple-600">Unlimited Branches</span>
                            </div>
                        </div>

                        <Link
                            to="/admin/billing"
                            onClick={() => setIsUpgradeModalOpen(false)}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            Upgrade Subscription <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchesManagement;
