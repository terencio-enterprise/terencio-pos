export type Language = 'en' | 'es';

const en = {
  app: {
    closeConfirmTitle: 'Confirm Close',
    closeConfirmMessage: 'Are you sure you want to close the application?',
    closeConfirmDetailLoggedIn: 'You will be logged out automatically and your shift will be closed.',
    closeConfirmDetailLoggedOut: 'The application will close.',
    closeButton: 'Close',
    cancelButton: 'Cancel',
  },
};

const es = {
  app: {
    closeConfirmTitle: 'Confirmar Cierre',
    closeConfirmMessage: '¿Está seguro que desea cerrar la aplicación?',
    closeConfirmDetailLoggedIn: 'Se cerrará su sesión automáticamente y su turno será finalizado.',
    closeConfirmDetailLoggedOut: 'La aplicación se cerrará.',
    closeButton: 'Cerrar',
    cancelButton: 'Cancelar',
  },
};

const translations = { en, es };

let currentLanguage: Language = 'es'; // Default Spanish

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}
