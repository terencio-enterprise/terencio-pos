import { createIpcContext, IpcContext, loadDeviceId } from './context';
import { registerAuthHandlers } from './handlers/auth';
import { registerRegistrationHandlers } from './handlers/registration';
import { registerShiftHandlers } from './handlers/shift';
import { registerSyncHandlers } from './handlers/sync';

export function initializeIpcHandlers(): IpcContext {
  const context = createIpcContext();

  void loadDeviceId(context);

  registerSyncHandlers(context);
  registerAuthHandlers(context);
  registerShiftHandlers(context);
  registerRegistrationHandlers(context);

  console.log('✅ IPC handlers initialized');
  
  return context;
}

export async function cleanupOnAppQuit(context: IpcContext): Promise<void> {
  try {
    const currentUser = context.getCurrentUser();
    
    if (currentUser) {
      // Check if user has an open shift
      const openShift = await context.shiftRepo.findOpenShiftByUserId(currentUser.id);
      
      if (openShift) {
        console.log(`🔄 Auto-closing shift for ${currentUser.username} on app quit...`);
        await context.shiftRepo.autoCloseShift(openShift.uuid);
        console.log('✅ Shift closed successfully');
      }
    }
  } catch (error) {
    console.error('❌ Error closing shift on app quit:', error);
  }
}
