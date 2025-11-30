/**
 * A generic wrapper for all API responses.
 * @template T The type of the `data` payload in a successful response.
 */
export interface ApiResponse<T> {
    success: boolean;       // Indicates if the request was successful
    message: string;        // A user-friendly message from the API
    data?: T;               // The actual data payload on success
    error?: ApiError;       // Error details on failure
}

/**
 * A standardized structure for API errors.
 */
export interface ApiError {
    status: boolean;        // Typically 'false' for an error
    message: string;        // The specific error message
}


// --- Authentication-Specific Models ---

/**
 * Defines the shape of the user object returned by the API.
 */
export interface UserResponse {
    id: string;
    email: string;
    // --- FIX: 'subagent' is now 'sub-agent' to match the API response. ---
    role: 'agent' | 'sub-agent' | 'admin';
}

export interface LoginRequest {
  username?: string;
  password?: string;
}

/**
 * Defines the shape of the data returned from a successful login response.
 */
export interface LoginResponse {
    token: string;
    user: UserResponse;
}

/**
 * Defines the shape of the request for resetting one's own password.
 */
export interface SelfResetPasswordRequest {
    password: string;
    confirm_password: string;
}

/**
 * Defines the shape of the request for resetting another user's password.
 */
export interface OtherResetPasswordRequest {
    user_id: string;
    password: string;
}

export interface PublicForgotPasswordRequest {
    username: string;
    password: string;
    confirm_password: string;
}
