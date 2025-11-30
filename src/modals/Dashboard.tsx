export interface DashboardData {
    // Admin-specific
    totalAgents?: number;

    // Admin & Agent specific
    totalSubAgents?: number;

    // Common to all roles
    totalUsers?: number;
    totalDeposit?: number;
    todayDeposit?: number;
    totalWithdraw?: number;
    todayWithdraw?: number;
    totalProfitLoss?: number;
    todayProfitLoss?: number;
    profitLossPercentage?: number;
    gamesPlayed?: number;
    todayGamesPlayed?: number;
}

/**
 * Defines the full API response structure for the dashboard.
 */
export interface DashboardApiResponse {
    message: string;
    data: DashboardData;
}
