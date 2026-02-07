import { PosRegistrationPreviewDto } from '@terencio/domain';
import { ipcMain } from 'electron';
import { machineIdSync } from 'node-machine-id';
import { IpcContext } from '../context';

export function registerSyncHandlers(context: IpcContext) {
  
  // Get stable Hardware ID
  const getHardwareId = () => {
    try {
      return machineIdSync(); 
    } catch (e) {
      return 'FALLBACK-DEV-ID';
    }
  };

  ipcMain.handle('sync:preview', async (_, code: string) => {
    try {
      const deviceId = getHardwareId();
      return await context.syncService.previewRegistration(code, deviceId);
    } catch (error: any) {
      console.error('IPC Sync Preview Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  });

  ipcMain.handle('sync:confirm', async (_, code: string, previewData: PosRegistrationPreviewDto) => {
    try {
      const hardwareId = getHardwareId();
      // Pass previewData to save users locally
      const result = await context.syncService.confirmRegistration(code, hardwareId, previewData);
      
      // Update Context
      context.setCurrentDeviceId(hardwareId);
      
      return result;
    } catch (error: any) {
      console.error('IPC Sync Confirm Error:', error);
      throw new Error(error.message || 'Registration Failed');
    }
  });

  ipcMain.handle('sync:checkStatus', async () => {
    return await context.posConfigRepo.isRegistered();
  });
}