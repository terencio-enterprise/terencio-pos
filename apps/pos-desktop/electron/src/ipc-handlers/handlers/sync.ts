import { POSConfiguration, POSRegistrationResponse } from '@terencio/domain';
import { ipcMain } from 'electron';
import { IpcContext } from '../context';

export function registerSyncHandlers(context: IpcContext) {
  ipcMain.handle('sync:checkStatus', async () => {
    try {
      const isRegistered = await context.posConfigRepo.isRegistered();
      return isRegistered;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  });

  // Preview registration data without saving
  ipcMain.handle('sync:preview', async (_event, code: string) => {
    try {
      const response = await context.syncService.previewRegistration(code);
      console.log('✅ Preview data fetched for code:', code);
      return response;
    } catch (error: any) {
      console.error('Error previewing registration:', error);
      throw error;
    }
  });

  // Confirm and save registration
  ipcMain.handle('sync:confirm', async (_event, registrationData: POSRegistrationResponse, code: string) => {
    try {
      // Save users from the registration data
      await context.syncService.registerPOS(registrationData, code);

      // Save POS configuration
      const posConfig: POSConfiguration = {
        pos_id: registrationData.posId,
        pos_name: registrationData.posName,
        store_id: registrationData.storeId,
        store_name: registrationData.storeName,
        device_id: registrationData.deviceId,
        registration_code: code,
        registered_at: new Date().toISOString(),
        is_active: 1,
      };

      await context.posConfigRepo.saveConfiguration(posConfig);
      context.setCurrentDeviceId(registrationData.deviceId);

      console.log('✅ POS configuration saved and confirmed');
      return posConfig;
    } catch (error: any) {
      console.error('Error confirming registration:', error);
      throw error;
    }
  });

  ipcMain.handle('sync:getConfig', async () => {
    try {
      const config = await context.posConfigRepo.getConfiguration();
      return config;
    } catch (error) {
      console.error('Error getting POS config:', error);
      return null;
    }
  });
}
