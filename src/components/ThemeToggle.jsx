import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
      title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {/* Sun icon for light mode */}
      <Sun
        className={`h-5 w-5 text-yellow-500 transition-all duration-300 ${
          theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
        } absolute inset-0 m-auto`}
      />

      {/* Moon icon for dark mode */}
      <Moon
        className={`h-5 w-5 text-blue-400 transition-all duration-300 ${
          theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
        } absolute inset-0 m-auto`}
      />

      {/* Spacer to maintain button size */}
      <span className="opacity-0">
        <Sun className="h-5 w-5" />
      </span>
    </button>
  );
};

export default ThemeToggle;
