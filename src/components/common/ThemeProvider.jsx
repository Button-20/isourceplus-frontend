import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Toaster } from "sonner";

import { storage } from "@/services/lib/storage";

// App theme. LIGHT is the default; DARK is opt-in and persisted under "theme".
// The `.dark` class on <html> drives every token in index.css. An inline script
// in index.html applies the stored theme before first paint (no flash); this
// provider keeps React in sync and owns the toggle.
const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    storage.get("theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    storage.set("theme", next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      storage.set("theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

// Sonner toaster wired to the current theme so toasts match light/dark.
// Messages stay until the user closes them (the backend's messages are
// descriptive); only login / logout toasts pass a short `duration` of their own.
export function ThemedToaster(props) {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={Infinity}
      theme={theme}
      {...props}
    />
  );
}
