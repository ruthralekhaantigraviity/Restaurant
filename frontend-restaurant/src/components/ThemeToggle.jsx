import { useState, useEffect } from 'react';
import { Sun, Moon, Check, Laptop } from 'lucide-react';

export const ThemeSettingCard = () => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        try {
            return localStorage.getItem('theme') || 'light';
        } catch {
            return 'light';
        }
    });

    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'light';
        setCurrentTheme(theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    }, []);

    const handleSelectTheme = (theme) => {
        setCurrentTheme(theme);
        try {
            localStorage.setItem('theme', theme);
        } catch (_) {}

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-5 transition-colors">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Appearance & Theme</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Customize your workspace visual mode. Switch between high-contrast Light and Dark mode.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-1">
                {/* Light Theme Card */}
                <button
                    type="button"
                    onClick={() => handleSelectTheme('light')}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all cursor-pointer ${
                        currentTheme === 'light'
                            ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                        <Sun size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Light Theme</p>
                            {currentTheme === 'light' && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Clean, crisp light background for daytime operations</p>
                    </div>
                    {currentTheme === 'light' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check size={14} />
                        </div>
                    )}
                </button>

                {/* Dark Theme Card */}
                <button
                    type="button"
                    onClick={() => handleSelectTheme('dark')}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all cursor-pointer ${
                        currentTheme === 'dark'
                            ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                        <Moon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Dark Theme</p>
                            {currentTheme === 'dark' && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Easy on the eyes for dim lighting and night shifts</p>
                    </div>
                    {currentTheme === 'dark' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check size={14} />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ThemeSettingCard;
