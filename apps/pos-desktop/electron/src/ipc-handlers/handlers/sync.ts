import { POSConfiguration } from '@terencio/domain';
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

  ipcMain.handle('sync:register', async (_event, code: string) => {
    try {
      const response = await context.syncService.registerPOS(code);

      const posConfig: POSConfiguration = {
        pos_id: response.posId,
        pos_name: response.posName,
        store_id: response.storeId,
        store_name: response.storeName,
        device_id: response.deviceId,
        registration_code: code,
        registered_at: new Date().toISOString(),
        is_active: 1,
      };

      await context.posConfigRepo.saveConfiguration(posConfig);

      context.setCurrentDeviceId(response.deviceId);

      console.log('✅ POS registered and configured successfully');
      return response;
    } catch (error: any) {
      console.error('Error during POS registration:', error);
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
