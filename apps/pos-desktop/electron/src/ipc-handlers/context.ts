import { User } from '@terencio/domain';
import { SqlitePOSConfigRepository } from '../repositories/pos-config.repository';
import { SqliteShiftRepository } from '../repositories/shift.repository';
import { SqliteUserRepository } from '../repositories/user.repository';
import { SyncService } from '../services/sync-service';

export interface IpcContext {
  userRepo: SqliteUserRepository;
  shiftRepo: SqliteShiftRepository;
  posConfigRepo: SqlitePOSConfigRepository;
  syncService: SyncService;
  getCurrentUser: () => User | null;
  setCurrentUser: (user: User | null) => void;
  getCurrentDeviceId: () => string;
  setCurrentDeviceId: (deviceId: string) => void;
}

export function createIpcContext(): IpcContext {
  const userRepo = new SqliteUserRepository();
  const shiftRepo = new SqliteShiftRepository();
  const posConfigRepo = new SqlitePOSConfigRepository();
  const syncService = new SyncService();

  let currentUser: User | null = null;
  let currentDeviceId: string = 'UNREGISTERED';

  return {
    userRepo,
    shiftRepo,
    posConfigRepo,
    syncService,
    getCurrentUser: () => currentUser,
    setCurrentUser: (user: User | null) => {
      currentUser = user;
    },
    getCurrentDeviceId: () => currentDeviceId,
    setCurrentDeviceId: (deviceId: string) => {
      currentDeviceId = deviceId;
    }
  };
}

export async function loadDeviceId(context: IpcContext): Promise<void> {
  try {
    const config = await context.posConfigRepo.getConfiguration();
    if (config && config.device_id) {
      context.setCurrentDeviceId(config.device_id);
      console.log(`📱 Device ID loaded: ${config.device_id}`);
    } else {
      console.log('⚠️  No POS configuration found - device not registered');
    }
  } catch (error) {
    console.error('Error loading device ID:', error);
  }
}
