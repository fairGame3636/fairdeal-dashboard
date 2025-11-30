import { APIEndpoints } from "../model/constants";
import { ApiResponse } from "../modals/Auth"; 
import NetworkService from './NetworkService';
import { ConfigResponse, UpdateVersionRequest } from "../modals/version";

class ConfigService {
  static async updateAppVersion(data: UpdateVersionRequest): Promise<ApiResponse<ConfigResponse>> {
    return NetworkService.privateRequest<ConfigResponse>({
      method: 'POST',
      url: APIEndpoints.Version.UPDATE_VERSION, 
      data: data
    });
  }
}

export default ConfigService;