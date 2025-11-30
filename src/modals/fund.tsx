/**
 * Defines the shape of the data for the balance-adjustment API request.
 */
export interface BalanceAdjustmentRequest {
    target_id: string;
    target_role: 'agent' | 'sub-agent' | 'user';
    amount: number;
    action: 'add' | 'subtract';
    comments?: string;
}

/**
 * Defines the shape of the data returned from the balance-adjustment API.
 */
export interface BalanceAdjustmentResponse {
    ok: boolean;
    balances: {
        fromBalance: number;
        toBalance: number;
    };
    message?: string; 
}
