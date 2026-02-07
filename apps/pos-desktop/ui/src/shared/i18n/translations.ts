import { create } from 'zustand';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];



const en = {
  login: {
    brand: 'Terencio POS',
    title: 'Welcome back',
    subtitle: 'Sign in with your username and 6-digit PIN',
    usernameLabel: 'Username',
    usernamePlaceholder: 'e.g. admin',
    pinLabel: 'PIN',
    pinHint: 'Focus here and type your 6-digit PIN',
    clear: 'Clear',
    signIn: 'Sign In'
  },
  welcome: {
    title: 'Welcome to Terencio',
    subtitle: 'Setup your Point of Sale',
    description: 'Connect your device to the main server to start selling.',
    startButton: 'Start Setup',
    exit: 'Exit'
  },
  code: {
    title: 'Enter Setup Code',
    subtitle: 'Enter the one-time setup code provided.',
    description: 'This 6-character code links this device to your store.',
    placeholder: 'ABC123',
    invalid: 'Invalid code format. Must be 6 alphanumeric characters.',
    expired: 'This code has expired. Please generate a new one.',
    verify: 'Verify Code',
    back: 'Back'
  },
  loading: {
    validating: 'Validating code...',
    fetching: 'Fetching configuration...',
    registering: 'Registering device...',
    finalizing: 'Finalizing setup...'
  },
  preview: {
    title: 'Confirm Configuration',
    subtitle: 'Please verify the following details before proceeding.',
    posName: 'POS Name',
    store: 'Store',
    location: 'Location',
    environment: 'Environment',
    deviceId: 'Device ID',
    confirm: 'Confirm & Activate',
    back: 'Back'
  },
  completion: {
    title: 'Setup Complete!',
    subtitle: 'Your POS is now ready to use.',
    launch: 'Launch POS',
    settings: 'Go to Settings',
    summary: 'Connected to'
  },
  common: {
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel'
  }
};

const es = {
  login: {
    brand: 'Terencio POS',
    title: 'Bienvenido de nuevo',
    subtitle: 'Ingresa tu usuario y tu PIN de 6 dígitos',
    usernameLabel: 'Usuario',
    usernamePlaceholder: 'ej. admin',
    pinLabel: 'PIN',
    pinHint: 'Enfoca aquí y escribe tu PIN de 6 dígitos',
    clear: 'Limpiar',
    signIn: 'Iniciar sesión'
  },
  welcome: {
    title: 'Bienvenido a Terencio',
    subtitle: 'Configura tu Punto de Venta',
    description: 'Conecta tu dispositivo al servidor principal para comenzar.',
    startButton: 'Iniciar Configuración',
    exit: 'Salir'
  },
  code: {
    title: 'Ingresa Código',
    subtitle: 'Introduce el código único de configuración proporcionado.',
    description: 'Este código de 6 caracteres vincula este dispositivo a tu tienda.',
    placeholder: 'ABC123',
    invalid: 'Formato inválido. Debe ser de 6 caracteres alfanuméricos.',
    expired: 'Este código ha expirado. Por favor genera uno nuevo.',
    verify: 'Verificar Código',
    back: 'Atrás'
  },
  loading: {
    validating: 'Validando código...',
    fetching: 'Obteniendo configuración...',
    registering: 'Registrando dispositivo...',
    finalizing: 'Finalizando configuración...'
  },
  preview: {
    title: 'Confirmar Configuración',
    subtitle: 'Por favor verifica los siguientes detalles antes de proceder.',
    posName: 'Nombre del POS',
    store: 'Tienda',
    location: 'Ubicación',
    environment: 'Ambiente',
    deviceId: 'ID de Dispositivo',
    confirm: 'Confirmar y Activar',
    back: 'Atrás'
  },
  completion: {
    title: '¡Configuración Completa!',
    subtitle: 'Tu POS está listo para usarse.',
    launch: 'Iniciar POS',
    settings: 'Ir a Ajustes',
    summary: 'Conectado a'
  },
  common: {
    error: 'Ocurrió un error',
    retry: 'Reintentar',
    cancel: 'Cancelar'
  }
};

const translations = { en, es };

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: 'es',
  setLanguage: (language) => set({ language }),
  t: (key: string) => {
    const { language } = get();
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }
}));

export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguageStore();
  return { t, language, setLanguage };
};
