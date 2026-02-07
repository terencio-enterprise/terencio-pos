import { createIpcContext, loadDeviceId } from './context';
import { registerAuthHandlers } from './handlers/auth';
import { registerShiftHandlers } from './handlers/shift';
import { registerSyncHandlers } from './handlers/sync';

export function initializeIpcHandlers() {
  const context = createIpcContext();

  void loadDeviceId(context);

  registerSyncHandlers(context);
  registerAuthHandlers(context);
  registerShiftHandlers(context);

  console.log('✅ IPC handlers initialized');
}
