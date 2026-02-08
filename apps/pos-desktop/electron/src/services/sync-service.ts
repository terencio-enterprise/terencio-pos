import {
    PosRegistrationPreviewDto,
    PosRegistrationResultDto,
    UserDto
} from '@terencio/domain';
import { db } from '../db/db';
import { ApiClient } from './api-client';

export class SyncService {
  private apiClient = new ApiClient();

  /**
   * Step 1: Preview
   * Calls backend to validate code and get store/user info.
   */
  async previewRegistration(code: string, deviceId: string): Promise<PosRegistrationPreviewDto> {
    console.log(`🔄 SyncService: Previewing code ${code} for device ${deviceId}`);
    return await this.apiClient.post<PosRegistrationPreviewDto>(
      '/api/v1/pos/registration/preview',
      { code, deviceId }
    );
  }

  /**
   * Step 2: Confirm
   * Calls backend to register device, then saves Config and Users locally.
   */
  async confirmRegistration(
    code: string, 
    hardwareId: string, 
    previewData: PosRegistrationPreviewDto
  ): Promise<PosRegistrationResultDto> {
    console.log(`🔄 SyncService: Confirming registration...`);

    // 1. Call Backend to Confirm
    const result = await this.apiClient.post<PosRegistrationResultDto>(
      '/api/v1/pos/registration/confirm',
      { code, hardwareId }
    );

    // 2. Save POS Config to SQLite
    this.savePosConfig(result, hardwareId);

    // 3. Save Users to SQLite (Data comes from the Preview step)
    if (previewData.users && previewData.users.length > 0) {
      this.saveUsers(previewData.users);
    }

    return result;
  }

  private savePosConfig(data: PosRegistrationResultDto, hardwareId: string) {
    const stmt = db!.prepare(`
      INSERT OR REPLACE INTO pos_config (
        id, pos_uuid, pos_serial_code, store_id, license_key, verifactu_enabled, updated_at
      ) VALUES (
        1, @pos_uuid, @pos_serial_code, @store_id, @license_key, 1, CURRENT_TIMESTAMP
      )
    `);

    stmt.run({
      pos_uuid: hardwareId,
      pos_serial_code: data.serialCode,
      store_id: data.storeId,
      license_key: data.licenseKey
    });
    console.log('✅ Local Config Saved');
  }

  private saveUsers(users: UserDto[]) {
    const stmt = db!.prepare(`
      INSERT OR REPLACE INTO users (
        id, username, pin_hash, full_name, role, is_active, created_at
      ) VALUES (
        @id, @username, @pin_hash, @full_name, @role, @is_active, CURRENT_TIMESTAMP
      )
    `);

    const transaction = db!.transaction((userList: UserDto[]) => {
      for (const u of userList) {
        stmt.run({
          id: u.id,
          username: u.username,
          pin_hash: u.pinHash, // Ensure backend sends BCrypt hash
          full_name: u.fullName,
          role: u.role,
          is_active: u.isActive ? 1 : 0
        });
      }
    });

    transaction(users);
    console.log(`✅ Saved ${users.length} users locally`);
  }
}