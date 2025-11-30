/**
 * Defines the shape of a single Table object returned from the getAllTables API.
 */
export interface GameTable {
    _id: string;
    name: string;
    winningType: 'FIX' | 'NET' | 'RND' | 'ROUND';
    winning_number?: number;
    winning_percentage?: number;
    winning_amount: number;
}

/**
 * Defines the payload for the decideResult API request.
 * All properties are optional as they depend on the 'type'.
 */
export interface DecideResultPayload {
    table_id: string;
    type: 'FIX' | 'NET' | 'RND' | 'ROUND' | 'ENDPOINTS';
    winning_number?: number;
    winning_percentage?: number;
    startDate?: string;
    endDate?: string;
}

export interface BetDetail {
    betId?: string;
    betType: string;
    selection?: string;
    stake: number;
    payout?: number;
    status?: 'won' | 'lost';
    type: string;
}
export interface NumberBoxProps {
    number: number;
    betAmount?: number;
    isWinning?: boolean;
}
export interface BetBoxProps {
    label: string | React.ReactNode;
    className?: string;
    color?: 'red' | 'black';
    betAmount?: number;
}
export interface RacetrackNumberBoxProps {
    number: number;
    betAmount?: number;
    isWinning?: boolean;
}

export interface RoundData {
    winningNumber: number | null;
    betDetails: { [key: string]: number };
    totalWinningAmount?: number;
}
