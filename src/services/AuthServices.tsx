import { APIEndpoints } from "../model/constants";
import { ApiResponse, LoginRequest, LoginResponse, SelfResetPasswordRequest, PublicForgotPasswordRequest, OtherResetPasswordRequest } from "../modals/Auth";
import NetworkService from './NetworkService';


class AuthService {
    static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        return NetworkService.publicRequest<LoginResponse>({
            method: 'POST',
            url: APIEndpoints.Auth.LOGIN,
            data: credentials
        });
    }

    static async selfResetPassword(data: SelfResetPasswordRequest): Promise<ApiResponse<any>> {
        return NetworkService.privateRequest({
            method: 'PUT', // Changed from GET as this is an update operation
            url: APIEndpoints.Auth.RESET_PASSWORD, // Assuming a single endpoint
            data: data,
        });
    }

    /**
     * Resets another user's password.
     */
    static async otherResetPassword(data: OtherResetPasswordRequest): Promise<ApiResponse<any>> {
        return NetworkService.privateRequest({
            method: 'PUT',
            url: APIEndpoints.Auth.RESET_PASSWORD, // Assuming a single endpoint
            data: data,
        });
    }

    static async dashboardLogout(): Promise<ApiResponse<any>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.Auth.DASHBOARD_LOGOUT, // Ensure this endpoint is in your constants
        });
    }

    static async publicForgotPassword(data: PublicForgotPasswordRequest): Promise<ApiResponse<any>> {
        return NetworkService.publicRequest({
            method: 'POST',
            url: APIEndpoints.Auth.PUBLIC_FORGOT_PASSWORD, // Add this to your APIEndpoints file
            data: data,
        });
    }
}

export default AuthService;

