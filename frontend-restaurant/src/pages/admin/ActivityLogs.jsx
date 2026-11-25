import { useState, useEffect } from 'react';
import { Search, Activity, User, ShoppingBag, Settings, LogIn, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const getLogIcon = (module) => {
    switch (module) {
        case 'Auth': return <LogIn size={16} />;
        case 'Settings': return <Settings size={16} />;
        case 'Order': return <ShoppingBag size={16} />;
        case 'Staff': return <User size={16} />;
        default: return <Activity size={16} />;
    }
};

const getLogColor = (type) => {
    switch(type) {
        case 'info': return 'bg-blue-100 text-blue-600';
        case 'danger': return 'bg-red-100 text-red-600';
        case 'warning': return 'bg-orange-100 text-orange-600';
        case 'success': return 'bg-green-100 text-green-600';
        default: return 'bg-gray-100 text-gray-600';
    }
};

const ActivityLogs = () => {
    const { api } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState('All Modules');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            const mapped = res.data.map(notif => {
                let type = 'info';
                if (notif.type === 'Alert') type = 'danger';
                else if (notif.type === 'Order') type = 'success';
                else if (notif.type === 'Info') type = 'warning';

                return {
                    _id: notif._id,
                    action: notif.title,
                    module: notif.type || 'System',
                    user: 'System Agent',
                    role: 'Daemon',
                    time: new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(notif.createdAt).toLocaleDateString(),
                    ip: '127.0.0.1',
                    desc: notif.desc,
                    type
                };
            });
            setLogs(mapped);
        } catch (err) {
            console.error('Failed to fetch notifications as logs', err);
            toast.error('Failed to load system logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.action?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             log.desc?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesModule = moduleFilter === 'All Modules' || log.module === moduleFilter;
        return matchesSearch && matchesModule;
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1800px] w-full mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Activity Audit Logs</h2>
                    <p className="text-gray-500 text-sm mt-1 dark:text-slate-400">Audit trail of all actions performed by users in the system.</p>
                </div>
                <button onClick={fetchLogs} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800">
                    <RefreshCcw size={16} /> Refresh Logs
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center dark:bg-slate-900 dark:border-slate-800">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by action or description..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all dark:bg-slate-950 dark:border-slate-800" 
                    />
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <select 
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800"
                    >
                        <option value="All Modules">All Modules</option>
                        <option value="Order">Order</option>
                        <option value="Alert">Alert</option>
                        <option value="Info">Info</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        No system activity audit logs found in database.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100 dark:bg-slate-950 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">Action / Module</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">User</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">Description</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">Time</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                                <div className={`p-2 rounded-lg ${getLogColor(log.type)}`}>
                                                    {getLogIcon(log.module)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm dark:text-white">{log.action}</p>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide dark:text-slate-400">{log.module}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900 text-sm dark:text-white">{log.user}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{log.role}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[300px] dark:text-slate-300" title={log.desc}>
                                            {log.desc}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{log.time}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{log.date}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono dark:text-slate-400">
                                            {log.ip}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogs;
