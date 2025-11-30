const Strings = {
    // app routes
    initialRoute: '/',
    verifyEmailRoute: '/verify-email',
    resetPasswordRoute: 'reset-password', // Uncomment if ResetPasswordPage is implemented
    forgotPasswordRoute: '/forgot-password',

    // Dashboard routes
    AdminDashboard: '/admin', 
    AgentDashboard: '/agent',
    SubAgentDashboard: '/subagent',
    GameUI: 'gameui',
    
    ApproveRejectWithdrawals: 'withdrawals',     // Relative path for agent and subagent
    RemitToAgent: 'remit-agent',                 // Relative path for subagent
    RemitToAdmin: 'remit-admin',                 // Relative path for agent and subagent
    FundTransfer: 'fund-transfer',             // Relative path for agent and subagent

    //Agent-Routes
    SearchUser: 'search-user',                   // Relative path for admin and agent
    BalanceAdjustment: 'balance-adjustment',     // Relative path for admin and agent
    KickoffUser: 'kickoff-user',               // Relative path for admin and agent
    CreateAgentOrSubagent: 'create-agent-subagent-user',        // Relative path for admin
    CreateSubAgent: 'create-subagent-user',           // Relative path for agent
    CreateUser: 'create-user',
    PointFile: 'points-file',                 // Relative path for agent
    InPoints: 'in-points',                     // Relative path for agent
    OutPoints: 'out-points',                   // Relative path for agent
    GameHistory: 'game-history',               // Relative path for agent
    TurnOver: 'turn-over',                     // Relative path for agent
    UpdateStatusPage: 'update-status',         // Relative path for admin, agent, and subagent
    ListUsersPage: 'list-users',         // Relative path for admin, agent, and subagent
    DecideResult: 'decide-result',
    UpdateCommission: 'update-commission',
    VersionUpdate: 'version/update'
}
export default Strings;