import {
    PosRegistrationConfirmRequest,
    PosRegistrationPreviewDto,
    PosRegistrationPreviewRequest,
    PosRegistrationResultDto,
} from '@terencio/domain';
import { ApiClient } from './api-client';

/**
 * Service for POS registration functionality.
 * Communicates with backend API endpoints for registration preview and confirmation.
 */
export class RegistrationService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Preview registration: validate code and return store/user context.
   * 
   * POST /api/v1/pos/registration/preview
   * 
   * @param code - Registration code to validate
   * @param deviceId - Device hardware ID
   * @returns Preview data with store and user information
   */
  async previewRegistration(
    code: string,
    deviceId: string
  ): Promise<PosRegistrationPreviewDto> {
    const request: PosRegistrationPreviewRequest = {
      code,
      deviceId,
    };

    return await this.apiClient.post<PosRegistrationPreviewDto>(
      '/api/v1/pos/registration/preview',
      request
    );
  }

  /**
   * Confirm registration: create device and return configuration.
   * 
   * POST /api/v1/pos/registration/confirm
   * 
   * @param code - Registration code
   * @param hardwareId - Device hardware ID
   * @returns Registration result with device and license information
   */
  async confirmRegistration(
    code: string,
    hardwareId: string
  ): Promise<PosRegistrationResultDto> {
    const request: PosRegistrationConfirmRequest = {
      code,
      hardwareId,
    };

    return await this.apiClient.post<PosRegistrationResultDto>(
      '/api/v1/pos/registration/confirm',
      request
    );
  }
}
