import { ipcMain } from 'electron';
import { RegistrationService } from '../../services/registration-service';
import { IpcContext } from '../context';

/**
 * Register IPC handlers for POS registration endpoints.
 * These handlers communicate with the backend API to validate and confirm device registration.
 */
export function registerRegistrationHandlers(context: IpcContext) {
  const registrationService = new RegistrationService();

  /**
   * Preview registration: validate code and return store/user context.
   * 
   * Handler: registration:preview
   * Endpoint: POST /api/v1/pos/registration/preview
   * 
   * @param code - Registration code to validate
   * @param deviceId - Device hardware ID
   * @returns Preview data with store and user information
   */
  ipcMain.handle('registration:preview', async (_event, code: string, deviceId: string) => {
    try {
      if (!code || code.trim() === '') {
        throw new Error('Registration code is required');
      }

      if (!deviceId || deviceId.trim() === '') {
        throw new Error('Device ID is required');
      }

      console.log(`🔍 Previewing registration with code: ${code}`);
      
      const preview = await registrationService.previewRegistration(code, deviceId);
      
      console.log(`✅ Registration preview successful for store: ${preview.storeName}`);
      
      return preview;
    } catch (error: any) {
      console.error('❌ Error previewing registration:', error);
      throw new Error(error.message || 'Failed to preview registration');
    }
  });

  /**
   * Confirm registration: create device and return configuration.
   * 
   * Handler: registration:confirm
   * Endpoint: POST /api/v1/pos/registration/confirm
   * 
   * @param code - Registration code
   * @param hardwareId - Device hardware ID
   * @returns Registration result with device and license information
   */
  ipcMain.handle('registration:confirm', async (_event, code: string, hardwareId: string) => {
    try {
      if (!code || code.trim() === '') {
        throw new Error('Registration code is required');
      }

      if (!hardwareId || hardwareId.trim() === '') {
        throw new Error('Hardware ID is required');
      }

      console.log(`🔐 Confirming registration with code: ${code}`);
      
      const result = await registrationService.confirmRegistration(code, hardwareId);
      
      // Update local POS configuration with registration data
      await context.posConfigRepo.saveConfiguration({
        id: 1,
        pos_uuid: hardwareId,
        pos_serial_code: result.serialCode,
        store_id: result.storeId,
        license_key: result.licenseKey,
        verifactu_enabled: 0,
        test_mode: 1,
        updated_at: new Date().toISOString(),
      });

      // Update context with new device ID (use hardware ID)
      context.setCurrentDeviceId(hardwareId);
      
      console.log(`✅ Registration confirmed successfully`);
      console.log(`   Store: ${result.storeName}`);
      console.log(`   Device ID: ${result.deviceId}`);
      console.log(`   Serial Code: ${result.serialCode}`);
      
      return result;
    } catch (error: any) {
      console.error('❌ Error confirming registration:', error);
      throw new Error(error.message || 'Failed to confirm registration');
    }
  });

  /**
   * Check if device is already registered.
   * 
   * Handler: registration:checkStatus
   * @returns Boolean indicating if device is registered
   */
  ipcMain.handle('registration:checkStatus', async () => {
    try {
      const isRegistered = await context.posConfigRepo.isRegistered();
      return isRegistered;
    } catch (error: any) {
      console.error('❌ Error checking registration status:', error);
      return false;
    }
  });

  /**
   * Get current POS configuration.
   * 
   * Handler: registration:getConfig
   * @returns Current POS configuration or null
   */
  ipcMain.handle('registration:getConfig', async () => {
    try {
      const config = await context.posConfigRepo.getConfiguration();
      return config;
    } catch (error: any) {
      console.error('❌ Error getting POS configuration:', error);
      return null;
    }
  });

  console.log('✅ Registration handlers registered');
}
