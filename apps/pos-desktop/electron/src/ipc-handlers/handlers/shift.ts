import { ipcMain } from 'electron';
import { IpcContext } from '../context';

export function registerShiftHandlers(context: IpcContext) {
  ipcMain.handle('shift:start', async (_event, startingCash: number) => {
    try {
      const currentUser = context.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const shift = await context.shiftRepo.startShift(
        currentUser.uuid,
        context.getCurrentDeviceId(),
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
      const currentUser = context.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const openShift = await context.shiftRepo.findOpenShiftByUserId(currentUser.uuid);

      if (!openShift) {
        throw new Error('No open shift found');
      }

      const closedShift = await context.shiftRepo.endShift(openShift.uuid, countedCash, notes);
      return closedShift;
    } catch (error) {
      console.error('Error ending shift:', error);
      throw error;
    }
  });

  ipcMain.handle('shift:getCurrent', async () => {
    try {
      const currentUser = context.getCurrentUser();
      if (!currentUser) {
        return null;
      }

      const shift = await context.shiftRepo.findOpenShiftByUserId(currentUser.uuid);
      return shift;
    } catch (error) {
      console.error('Error getting current shift:', error);
      throw error;
    }
  });

  ipcMain.handle('shift:getHistory', async () => {
    try {
      const currentUser = context.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const shifts = await context.shiftRepo.findAllByUserId(currentUser.uuid);
      return shifts;
    } catch (error) {
      console.error('Error getting shift history:', error);
      throw error;
    }
  });
}
