import { PaginationInfo } from "./User"; // Assuming PaginationInfo is in User.ts

export interface GameHistoryParams {
    userName?: string;
    startDate?: string;
    endDate?: string;
    dateFilter?: 'today' | 'yesterday' | 'this_week' | '';
    page?: number;
    limit?: number;
    export?: boolean;
}

export interface BetDetail {
    betId: string;
    betType: string;
    selection?: string;
    stake: number;
    payout: number;
    status: 'won' | 'lost';
    betTimestamp: string;
}


export interface GameHistoryItem {
    userName: string;
    agentId?: string;
    subAgentId?: string;
    agentName?: string;      // This field is now provided by the backend
    subAgentName?: string;   // This field is now provided by the backend
    roundId: string;
    winningNumber: number | string;
    label: string;
    totalStake: number;
    totalPayout: number;
    beforePlayPoints: number;
    afterPlayPoints: number;
    bets: BetDetail[];
    DATETIME: string;
}


export interface GameHistoryResponse {
    count: number;
    grandTotalStake: number;
    grandTotalPayout: number;
    history: GameHistoryItem[];
    pagination: PaginationInfo;
}



// -----------------------------------------------------------
// POINT FILE INTERFACES:


export interface LedgerItem {
    SNO: number;
    DATE: string;       // ISO date string
    RECEIVER: string;
    OLD_POINTS: number;
    IN: number;
    OUT: number;
    NEW_POINTS: number;
    SENDER: string;
    TRANS_ID: string;
    COMMENTS: string | null;
}

/**
 * Defines the shape for the summary object containing total points.
 */
export interface LedgerSummary {
    totalIn: number;
    totalOut: number;
}

/**
 * Defines the complete shape of the points/ledger API response.
 */
export interface LedgerResponse {
    message: string;
    summary: LedgerSummary;
    count: number;
    records: LedgerItem[];
    pagination: PaginationInfo;
}

/**
 * Defines the shape of the request parameters for the points/ledger API.
 */

// This is your existing interface, it can stay the same
export interface LedgerParams {
    username?: string;
    receiveBy?: string;
    sendBy?: string;
    startDate?: string;
    endDate?: string;
    dateRange?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | undefined;
    page?: number;
    limit?: number;
}
/**
 * Defines the shape of the API response for the Out-Points report.
 */
export interface OutPointsResponse {
    message: string;
    totalOUT: number;
    count: number;
    records: LedgerItem[];
    pagination: PaginationInfo;
}

export interface InPointsResponse {
    message: string;
    totalIN: number;
    count: number;
    records: LedgerItem[];
    pagination: PaginationInfo;
}

// ---------------------------------------
// TURN-OVER INTERFACES:
// This is your existing interface, it can stay the same
export interface TurnoverSummary {
    totalPlayPoints: number;
    totalWonPoints: number;
    totalEndPoints: number;
    totalMargin: number;
    totalNet: number;
    totalProfit: number
}

// --- THIS IS THE UPDATED INTERFACE ---
// Replace your old TurnoverRecord with this
export interface TurnoverRecord {
    id: string;         // <-- CHANGED: from 'username' to 'id'
    name: string;       // <-- ADDED: This is the new display name (Agent, Sub-agent, or User)
    playPoints: number;
    wonPoints: number;
    endPoints: number;
    margin: number;
    net: number;
    createdAt: string; // This is 'Last Play' date (DD/MM/YYYY)
}

// --- THIS IS THE UPDATED INTERFACE ---
// Replace your old TurnoverResponse with this
export interface TurnoverResponse {
    message: string;
    count: number;
    report: TurnoverRecord[];
    summary: TurnoverSummary;
    pagination: PaginationInfo;
    viewLevel: 'agent' | 'subagent' | 'user'; // <-- ADDED: This is crucial
}
