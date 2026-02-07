import { POSConfiguration, User } from '@terencio/domain';
import { ipcMain } from 'electron';
import { SqlitePOSConfigRepository } from './repositories/pos-config.repository';
import { SqliteShiftRepository } from './repositories/shift.repository';
import { SqliteUserRepository } from './repositories/user.repository';
import { SyncService } from './services/sync-service';

let userRepo: SqliteUserRepository;
let shiftRepo: SqliteShiftRepository;
let posConfigRepo: SqlitePOSConfigRepository;
let syncService: SyncService;

// Store current user session
let currentUser: User | null = null;
let currentDeviceId: string = 'UNREGISTERED'; // Will be updated from POS config

export function initializeIpcHandlers() {
  userRepo = new SqliteUserRepository();
  shiftRepo = new SqliteShiftRepository();
  posConfigRepo = new SqlitePOSConfigRepository();
  syncService = new SyncService();

  // Load device ID from POS configuration
  loadDeviceId();

  // ==================================================================================
  // SYNC HANDLERS
  // ==================================================================================

  ipcMain.handle('sync:checkStatus', async () => {
    try {
      const isRegistered = await posConfigRepo.isRegistered();
      return isRegistered;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  });

  ipcMain.handle('sync:register', async (_event, code: string) => {
    try {
      // Register with backend
      const response = await syncService.registerPOS(code);

      // Save configuration locally
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

      await posConfigRepo.saveConfiguration(posConfig);

      // Update current device ID
      currentDeviceId = response.deviceId;

      console.log('✅ POS registered and configured successfully');
      return response;
    } catch (error: any) {
      console.error('Error during POS registration:', error);
      throw error;
    }
  });

  ipcMain.handle('sync:getConfig', async () => {
    try {
      const config = await posConfigRepo.getConfiguration();
      return config;
    } catch (error) {
      console.error('Error getting POS config:', error);
      return null;
    }
  });

  // ==================================================================================
  // AUTHENTICATION HANDLERS
  // ==================================================================================

  ipcMain.handle('auth:listUsers', async () => {
    try {
      const users = await userRepo.findAllActive();
      // Don't send pin_hash to frontend for security
      return users.map(u => ({
        uuid: u.uuid,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at
      }));
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:login', async (_event, username: string, pin: string) => {
    try {
      const user = await userRepo.authenticateWithPin(username, pin);
      
      if (!user) {
        throw new Error('Invalid username or PIN');
      }

      // Store current user in session
      currentUser = user;

      // Return user without pin_hash
      return {
        uuid: user.uuid,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:getCurrentUser', async () => {
    if (!currentUser) {
      return null;
    }
    
    return {
      uuid: currentUser.uuid,
      username: currentUser.username,
      full_name: currentUser.full_name,
      role: currentUser.role,
      is_active: currentUser.is_active,
      created_at: currentUser.created_at
    };
  });

  // ==================================================================================
  // SHIFT HANDLERS
  // ==================================================================================

  ipcMain.handle('shift:start', async (_event, startingCash: number) => {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const shift = await shiftRepo.startShift(
        currentUser.uuid,
        currentDeviceId,
        startingCash
      );

      return shift;
    } catch (error) {
      console.error('Error starting shift:', error);
      throw error;
    }
  });

  ipcMain.handle('shift:end', async (_event, countedCash: number, notes?: string) => {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Get current open shift
      const openShift = await shiftRepo.findOpenShiftByUserId(currentUser.uuid);
      
      if (!openShift) {
        throw new Error('No open shift found');
      }

      const closedShift = await shiftRepo.endShift(openShift.uuid, countedCash, notes);
      return closedShift;
    } catch (error) {
      console.error('Error ending shift:', error);
      throw error;
    }
  });

  ipcMain.handle('shift:getCurrent', async () => {
    try {
      if (!currentUser) {
        return null;
      }

      const shift = await shiftRepo.findOpenShiftByUserId(currentUser.uuid);
      return shift;
    } catch (error) {
      console.error('Error getting current shift:', error);
      throw error;
    }
  });

  ipcMain.handle('shift:getHistory', async () => {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const shifts = await shiftRepo.findAllByUserId(currentUser.uuid);
      return shifts;
    } catch (error) {
      console.error('Error getting shift history:', error);
      throw error;
    }
  });

  console.log('✅ IPC handlers initialized');
}

/**
 * Load device ID from POS configuration
 */
async function loadDeviceId() {
  try {
    const config = await posConfigRepo.getConfiguration();
    if (config && config.device_id) {
      currentDeviceId = config.device_id;
      console.log(`📱 Device ID loaded: ${currentDeviceId}`);
    } else {
      console.log('⚠️  No POS configuration found - device not registered');
    }
  } catch (error) {
    console.error('Error loading device ID:', error);
  }
}
