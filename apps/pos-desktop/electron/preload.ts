import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sync: {
    checkStatus: () => ipcRenderer.invoke('sync:checkStatus'),
    register: (code: string) => ipcRenderer.invoke('sync:register', code),
    getConfig: () => ipcRenderer.invoke('sync:getConfig')
  },
  auth: {
    listUsers: () => ipcRenderer.invoke('auth:listUsers'),
    login: (username: string, pin: string) => ipcRenderer.invoke('auth:login', username, pin),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser')
  },
  shift: {
    start: (startingCash: number) => ipcRenderer.invoke('shift:start', startingCash),
    end: (countedCash: number, notes?: string) => ipcRenderer.invoke('shift:end', countedCash, notes),
    getCurrent: () => ipcRenderer.invoke('shift:getCurrent'),
    getHistory: () => ipcRenderer.invoke('shift:getHistory')
  }
});