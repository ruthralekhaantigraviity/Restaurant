import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    isDark: false,
    theme: 'light',
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');

    const isDark = theme === 'dark';

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
            try { localStorage.setItem('theme', 'dark'); } catch (_) {}
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
            try { localStorage.setItem('theme', 'light'); } catch (_) {}
        }

        // Custom event for any components outside React tree
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
    }, [isDark, theme]);

    // Listen to cross-tab storage changes
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
                setTheme(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
