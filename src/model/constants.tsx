export const APIEndpoints = {
    BASE_URL: "https://api.thefairdeal.games",

    Auth: {
        LOGIN: "/auth/dashboard/login",
        RESET_PASSWORD: '/auth/dashboard/reset-password', 
        DASHBOARD_LOGOUT: '/auth/dashboard/logout', 
        PUBLIC_FORGOT_PASSWORD: 'auth/public-forgot-password'
    },

    User: {
        CREATE_USER: "/user/create-user",
        LIST_USERS: "/user/list-user",
        UPDATE_STATUS: "/user/update-status",
        GET_CURRENT_USER: "/user/me", 
        FETCH_PROFILE: "user/fetch-profile",
        UPDATE_LOCK_STATUS: 'user/update-lock-status',
        KICKOFF_USER: "/user/kickoff-user", 
        UPDATE_COMMISSION: '/user/update-commission', 
        UPDATE_AGENTS: '/user/update-agents', 
        DELETE_USER: '/user/delete-user', 
        LIST_ACTIVE_PLAYING_USERS: '/user/active-users'  
    },

    Report: {
        GAME_HISTORY: "/reports/game-history",
        POINTS: '/reports/points', 
        OUT_POINTS: '/reports/out-points', 
        IN_POINTS: '/reports/In-points', 
        TURNOVER: '/reports/turnover'
    }, 

    fund: {
        BALANCE_ADJUSTMENT: '/v1/funds/balance-adjustment'
    }, 

    Dashboard: {
        GET_DATA: '/dashboard'
    }, 

    GameControl: {
        GET_ALL_TABLES: '/tables', 
        DECIDE_RESULT: '/tables/decide-result'
    },

    Version: {
        UPDATE_VERSION: '/v1/version/enter'
    }
};
