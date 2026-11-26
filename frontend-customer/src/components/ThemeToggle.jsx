import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ className = '', iconSize = 17 }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#FF5A1F] dark:hover:text-[#FF5A1F] transition-colors cursor-pointer shrink-0 flex items-center justify-center ${className}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? (
                <Sun size={iconSize} className="text-amber-400 transition-transform hover:rotate-45" />
            ) : (
                <Moon size={iconSize} className="transition-transform hover:-rotate-12" />
            )}
        </button>
    );
};

export const ThemeSettingCard = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-slate-800 text-[#FF5A1F] flex items-center justify-center">
                        {isDark ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Appearance & Theme</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isDark ? 'Dark theme active' : 'Light theme active'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                    Switch to {isDark ? 'Light' : 'Dark'}
                </button>
            </div>
        </div>
    );
};

export default ThemeToggle;
