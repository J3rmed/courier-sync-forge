import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type FontSize = 'normal' | 'large' | 'extra-large';
type ContrastMode = 'normal' | 'high';

interface AccessibilitySettings {
  fontSize: FontSize;
  contrastMode: ContrastMode;
}

interface AccessibilityContextType {
  fontSize: FontSize;
  contrastMode: ContrastMode;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleContrastMode: () => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = 'couriersync:accessibility';

const defaultSettings: AccessibilitySettings = {
  fontSize: 'normal',
  contrastMode: 'normal'
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [contrastMode, setContrastMode] = useState<ContrastMode>('normal');

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const settings: AccessibilitySettings = JSON.parse(saved);
        setFontSize(settings.fontSize);
        setContrastMode(settings.contrastMode);
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }
  }, []);

  // Guardar configuración cuando cambie
  useEffect(() => {
    const settings: AccessibilitySettings = {
      fontSize,
      contrastMode
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // Aplicar clase al documento
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-contrast', contrastMode);
  }, [fontSize, contrastMode]);

  const increaseFontSize = () => {
    setFontSize(current => {
      if (current === 'normal') return 'large';
      if (current === 'large') return 'extra-large';
      return 'extra-large';
    });
  };

  const decreaseFontSize = () => {
    setFontSize(current => {
      if (current === 'extra-large') return 'large';
      if (current === 'large') return 'normal';
      return 'normal';
    });
  };

  const toggleContrastMode = () => {
    setContrastMode(current => current === 'normal' ? 'high' : 'normal');
  };

  const resetSettings = () => {
    setFontSize(defaultSettings.fontSize);
    setContrastMode(defaultSettings.contrastMode);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        contrastMode,
        increaseFontSize,
        decreaseFontSize,
        toggleContrastMode,
        resetSettings
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
