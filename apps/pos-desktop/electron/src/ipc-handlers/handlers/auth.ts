import { ipcMain } from 'electron';
import { IpcContext } from '../context';

export function registerAuthHandlers(context: IpcContext) {
  ipcMain.handle('auth:listUsers', async () => {
    try {
      const users = await context.userRepo.findAllActive();
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
      const user = await context.userRepo.authenticateWithPin(username, pin);

      if (!user) {
        throw new Error('Invalid username or PIN');
      }

      context.setCurrentUser(user);

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
      context.setCurrentUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:getCurrentUser', async () => {
    const currentUser = context.getCurrentUser();
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
}
