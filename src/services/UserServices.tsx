import { APIEndpoints } from "../model/constants";
import { ApiResponse } from "../modals/Auth";
import { CreateUserRequest, ListUsersResponse, UpdateAgentsRequest, CreateUserApiResponse, UpdateCommissionRequest, UpdateStatusRequest, ListUserParams, UserProfile } from "../modals/User";
import NetworkService from './NetworkService';

class UserService {
    /**
     * Creates a new user, agent, or subagent.
     */
    static async createUser(userData: CreateUserRequest): Promise<ApiResponse<CreateUserApiResponse>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.User.CREATE_USER,
            data: userData,
        });
    }

    static async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
        return NetworkService.privateRequest({
            method: 'DELETE',
            url: `${APIEndpoints.User.DELETE_USER}/${userId}`,
            data: { userIdToDelete: userId },
        });
    }

    static async listUser(params: ListUserParams): Promise<ApiResponse<ListUsersResponse>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.User.LIST_USERS,
            data: params, // Pass all params, including page, limit, and status
        });
    }


    static async listSubagentsForAgent(agentId: string): Promise<ApiResponse<ListUsersResponse>> {
        // We use the main listUser function here, passing the correct parameters.
        return this.listUser({ 
            role: 'sub-agent',
            agent_id: agentId 
        });
    }

    static async updateStatus(statusData: UpdateStatusRequest): Promise<ApiResponse<any>> {
        return NetworkService.privateRequest({
            method: 'PUT',
            url: APIEndpoints.User.UPDATE_STATUS,
            data: statusData
        });
    }

    static async getProfile(): Promise<ApiResponse<{ user: UserProfile }>> {
        return NetworkService.privateRequest({
            method: 'GET',
            url: APIEndpoints.User.FETCH_PROFILE,
        });
    }

    static async listActivePlayingUsers(params: { page?: number, limit?: number }): Promise<ApiResponse<ListUsersResponse>> {
        return NetworkService.privateRequest({
            method: 'GET',
            url: APIEndpoints.User.LIST_ACTIVE_PLAYING_USERS, 
            data: params, // Sends { page, limit }
        });
    }


    static async getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
        return NetworkService.privateRequest({
            method: 'GET',
            url: APIEndpoints.User.GET_CURRENT_USER,
        });
    }
    static async kickoffUser(userId: string): Promise<ApiResponse<{ message: string }>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.User.KICKOFF_USER,
            data: { userIdToKick: userId },
        });
    }

    static async updateLockStatus(userId: string, lockStatus: 'locked' | 'unlocked'): Promise<ApiResponse<{ message: string }>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.User.UPDATE_LOCK_STATUS, 
            data: {
                userIdToUpdate: userId,
                lockStatus: lockStatus,
            },
        });
    }

    static async updateUserAgents(payload: UpdateAgentsRequest): Promise<ApiResponse<{ message: string }>> {
        return NetworkService.privateRequest({
            method: 'PATCH',
            url: APIEndpoints.User.UPDATE_AGENTS, 
            data: payload,
        });
    }

    static async updateCommission(payload: UpdateCommissionRequest): Promise<ApiResponse<{ message: string }>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.User.UPDATE_COMMISSION, // Example: '/api/user/update-commission'
            data: payload,
        });
    }

}

export default UserService;

