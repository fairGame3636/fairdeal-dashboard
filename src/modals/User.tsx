/**
 * A unified interface for user data returned from the listUser API.
 * Fields are optional to accommodate different use cases (simple dropdowns vs. detailed tables).
 */

export interface UserListItem {
    _id: string;
    name: string;
    username?: string;
    role?: 'agent' | 'sub-agent' | 'user';
    status?: 'active' | 'deactivate' | 'suspend' | 'ideal' | 'playing';
    points?: number;
    email: string; // Added
    lock_status: 'locked' | 'unlocked'; // Added
    commission?: number;
    
    // Parent IDs
    admin_id?: string;
    agent_id?: string;
    subagent_id?: string;

    // Parent Names (added by backend)
    agentName?: string;
    subagentName?: string;

    // --- NEW: Added for the Kickoff User page ---
    lastlogin?: string; // This will be an ISO date string from the backend
}

export interface UpdateCommissionRequest {
    target_id: string;
    commission: number;
}

/**
 * Defines the shape of the data for the update-status API request.
 */
export interface UpdateStatusRequest {
    user_id: string;
    status: 'active' | 'deactivate' | 'suspend' | 'ideal' | 'playing';
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    nextPage: number;
    prevPage: number;
    recordsPerPage: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Defines the shape of the data returned from the list-users API.
 */
export interface ListUsersResponse {
    count: number;
    users: UserListItem[];
    pagination: PaginationInfo;
}

/**
 * Defines the shape of the data for the create-user API request.
 */

export interface CreateUserRequest {
    username: string;
    password?: string;
    phone_number?: string;
    email?: string;
    type: 'agent' | 'sub-agent' | 'user';
    commission?: number;
    agent_id?: string;
    subagent_id?: string;
}

/**
 * A specific interface for the user object inside the creation response.
 */
export interface CreatedUser {
    id: string;
    name: string;
    email: string;
    role: 'agent' | 'sub-agent' | 'user';
    isFirstTimeLogin: boolean;
    created_by: string;
}

export interface UpdateAgentsRequest {
  userId: string;
  agent_id?: string;
  subagent_id?: string;
}

/**
 * A specific interface for the entire create-user response payload.
 */
export interface CreateUserApiResponse {
    message: string;
    user: CreatedUser;
}

export interface ListUserParams {
    role: 'agent' | 'sub-agent' | 'user';
    status?: 'active' | 'deactivate' | 'suspend' | 'ideal' | 'playing'; // Added status
    agent_id?: string;
    admin_id?: string;
    subagent_id?: string;
    page?: number;   // Added page
    limit?: number;  // Added limit
}

export interface UserProfile {
    id: string;
    username: string;
    commission?: number;
    name?: string; 
    email?: string;
    phone_number?: string;
    role: 'admin' | 'agent' | 'sub-agent';
    status: string;
    createdAt: string;
    wallet: {
        current_balance: number;
        last_balance: number;
    };
}
