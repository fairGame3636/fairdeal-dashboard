import { APIEndpoints } from '../model/constants'; // Assuming your API constants are here
import { ApiResponse } from '../modals/Auth'; // Assuming a generic ApiResponse type
import { GameTable, DecideResultPayload } from '../modals/Game';
import NetworkService from './NetworkService'; // Your centralized API request handler

class GameControlService {
    /**
     * Fetches all available game tables from the backend.
     */
    static async getAllTables(): Promise<ApiResponse<GameTable[]>> {
        return NetworkService.privateRequest({
            method: 'GET',
            url: APIEndpoints.GameControl.GET_ALL_TABLES, // Example: '/api/tables/all'
        });
    }

    /**
     * Submits the result decision to the backend.
     * @param payload The data for deciding the result.
     */
    static async decideResult(payload: DecideResultPayload): Promise<ApiResponse<{ message: string }>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.GameControl.DECIDE_RESULT, // Example: '/api/game/decide-result'
            data: payload,
        });
    }
}

export default GameControlService;
