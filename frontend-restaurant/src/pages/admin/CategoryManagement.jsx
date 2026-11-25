import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Folder, Tag, GripVertical, ChevronDown, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const CategoryManagement = ({ embedded = false, onUpdated }) => {
    const { api } = useAuth();
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        branch: '',
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
            const [catRes, branchesRes] = await Promise.all([
                api.get('/categories'),
                api.get('/branches')
            ]);
            setCategories(catRes.data);
            setBranches(branchesRes.data);
            
            if (branchesRes.data.length > 0 && !formData.branch) {
                setFormData(prev => ({ ...prev, branch: branchesRes.data[0]._id }));
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
            title: 'Delete Category',
            message: 'Are you sure you want to delete this category?',
            onConfirm: async () => {
                try {
                    await api.delete(`/categories/${id}`);
                    fetchData();
                    if (onUpdated) onUpdated();
                    toast.success('Category deleted successfully');
                } catch (error) {
                    console.error('Failed to delete category', error);
                    toast.error('Failed to delete category');
                }
            },
            isDestructive: true
        });
    };

    const handleAddClick = () => {
        setFormData({
            name: '',
            description: '',
            branch: branches.length > 0 ? branches[0]._id : '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', formData);
            fetchData();
            if (onUpdated) onUpdated();
            setIsModalOpen(false);
            toast.success('Category created successfully');
        } catch (error) {
            console.error('Failed to create category', error);
            toast.error(error.response?.data?.message || 'Failed to create category');
        }
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group categories by branch
    const categoriesByBranch = filteredCategories.reduce((acc, cat) => {
        const branchName = cat.branch ? cat.branch.name : 'Unknown Branch';
        if (!acc[branchName]) {
            acc[branchName] = [];
        }
        acc[branchName].push(cat);
        return acc;
    }, {});

    return (
        <div className="space-y-6 relative">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {!embedded ? (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>Menu Categories</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Organize your menu into categories and subcategories.</p>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Manage Categories</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">Add and organize categories by branch.</p>
                    </div>
                )}
                <button 
                    onClick={handleAddClick}
                    className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl font-bold transition-all inline-flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                >
                    <Plus size={16} /> New Category
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search categories..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                </div>
                <button className="h-10 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-bold px-4 rounded-xl text-xs sm:text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all inline-flex items-center justify-center cursor-pointer shrink-0">
                    Expand All
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <div className="col-span-6">Category Name</div>
                    <div className="col-span-3 text-center sm:text-left">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {loading ? (
                        <div className="flex justify-center p-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : Object.keys(categoriesByBranch).length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-slate-400 text-sm font-medium">No categories found.</div>
                    ) : (
                        Object.entries(categoriesByBranch).map(([branchName, branchCategories]) => (
                            <div key={branchName}>
                                {/* Branch Header as "Category" */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center bg-gray-50/40 dark:bg-slate-800/20 border-b border-gray-100/60 dark:border-slate-800/60">
                                    <div className="col-span-6 flex items-center gap-3">
                                        <GripVertical size={16} className="text-gray-300 dark:text-slate-600 cursor-grab shrink-0" />
                                        <button className="p-1 bg-gray-100 dark:bg-slate-800 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                                            <ChevronDown size={14} className="text-gray-600 dark:text-slate-300" />
                                        </button>
                                        <Folder size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="font-bold text-gray-900 dark:text-white truncate">{branchName}</span>
                                    </div>
                                    <div className="col-span-3 text-center sm:text-left">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                            Active
                                        </span>
                                    </div>
                                    <div className="col-span-3"></div>
                                </div>
                                
                                {/* Actual Categories */}
                                <div>
                                    {branchCategories.map((cat) => (
                                        <div key={cat._id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center group hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors border-b border-gray-50 dark:border-slate-800/40 last:border-b-0">
                                            <div className="col-span-6 flex items-center gap-3 pl-8">
                                                <GripVertical size={16} className="text-gray-300 dark:text-slate-600 cursor-grab shrink-0" />
                                                <Tag size={15} className="text-gray-400 dark:text-slate-500 shrink-0" />
                                                <span className="font-semibold text-gray-800 dark:text-slate-200 text-sm truncate">{cat.name}</span>
                                                {cat.description && (
                                                    <span className="text-xs text-gray-400 dark:text-slate-500 truncate ml-1 hidden md:inline-block max-w-[200px]">- {cat.description}</span>
                                                )}
                                            </div>
                                            <div className="col-span-3 text-center sm:text-left">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${cat.isActive ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60'}`}>
                                                    {cat.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="col-span-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button 
                                                        onClick={() => handleDelete(cat._id)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col dark:bg-slate-900">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 text-lg dark:text-white">New Category</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <form id="category-form" onSubmit={handleSubmit} className="space-y-4 min-w-0 pr-1.5 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-200">Category Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all dark:bg-slate-950 dark:border-slate-800"
                                        placeholder="e.g. Main Course, Desserts"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-200">Branch</label>
                                    <select 
                                        value={formData.branch}
                                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all dark:bg-slate-950 dark:border-slate-800"
                                        required
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-200">Description (Optional)</label>
                                    <textarea 
                                        rows="2"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none dark:bg-slate-950 dark:border-slate-800"
                                        placeholder="Brief description..."
                                    />
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
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-slate-200">
                                        Active Category
                                    </label>
                                </div>
                                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0 mt-6 -mx-6 -mb-6 dark:border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                    >
                                        Create Category
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

export default CategoryManagement;
