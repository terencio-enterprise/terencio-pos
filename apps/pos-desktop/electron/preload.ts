import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Safe IPC defaults
});