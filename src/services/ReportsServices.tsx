import { APIEndpoints } from '../model/constants';
import { ApiResponse } from '../modals/Auth';
import { 
    GameHistoryParams, 
    GameHistoryResponse, 
    LedgerParams, 
    LedgerResponse, 
    OutPointsResponse, 
    InPointsResponse, 
    TurnoverResponse
} from '../modals/reports';
import NetworkService from './NetworkService';

// Define a common type for report parameters
type ReportParams = LedgerParams | GameHistoryParams ;

class ReportService {
    // --- JSON DATA FETCHING ---

    static async getLedger(params: LedgerParams): Promise<ApiResponse<LedgerResponse>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.Report.POINTS, // Ensure this endpoint is correct in your constants
            data: params,
        });
    }

    static async getOutPoints(params: LedgerParams): Promise<ApiResponse<OutPointsResponse>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.Report.OUT_POINTS,
            data: params,
        });
    }

    static async getInPoints(params: LedgerParams): Promise<ApiResponse<InPointsResponse>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.Report.IN_POINTS,
            data: params,
        });
    }
    
    static async getTurnover(params: LedgerParams): Promise<ApiResponse<TurnoverResponse>> {
        return NetworkService.privateRequest({
            method: 'POST', 
            url: APIEndpoints.Report.TURNOVER, 
            data: params,
        });
    }

    static async getGameHistory(params: GameHistoryParams): Promise<ApiResponse<GameHistoryResponse>> {
        return NetworkService.privateRequest({
            method: 'POST',
            url: APIEndpoints.Report.GAME_HISTORY,
            data: params,
        });
    }

    static async getRoundDetails(roundId: string): Promise<ApiResponse<any>> {
        return NetworkService.privateRequest({
            method: 'GET',
            url: `/reports/round-details/${roundId}`, 
            
        });
    }

    static async exportLedger(params: LedgerParams): Promise<Blob> {
        const response = await NetworkService.privateRequest<Blob>({
            method: 'POST',
            url: APIEndpoints.Report.POINTS,
            data: { ...params, export: true }, // Add the export flag for the backend
            responseType: 'blob', // This is critical for handling file downloads
        });
        
        // Ensure response.data is present; throw descriptive error if not.
        if (!response || !response.data) {
            throw new Error('Export failed: no file returned from server.');
        }
        return response.data;
    }

    static async exportInPoints(params: LedgerParams): Promise<Blob> {
        const { page, limit, ...exportParams } = params;
        
        const response = await NetworkService.privateRequest<Blob>({
            method: 'POST',
            url: APIEndpoints.Report.IN_POINTS,
            data: { ...exportParams, export: true }, 
            responseType: 'blob', 
        });
        
        // Ensure response.data is present; throw descriptive error if not.
        if (!response || !response.data) {
            throw new Error('Export failed: no file returned from server.');
        }
        return response.data;
    }

    static async exportOutPoints(params: LedgerParams): Promise<Blob> 
    {
            const { page, limit, ...exportParams } = params;
            
            const response = await NetworkService.privateRequest<Blob>({
                method: 'POST',
                url: APIEndpoints.Report.OUT_POINTS,
                data: { ...exportParams, export: true },
                responseType: 'blob',
            });
            
            // Ensure response.data is present; throw descriptive error if not.
            if (!response || !response.data) 
            {
                throw new Error('Export failed: no file returned from server.');
            }
            return response.data;
    }

    static async exportTurnover(params: LedgerParams): Promise<Blob> {
        const { page, limit, ...exportParams } = params;
        
        const response = await NetworkService.privateRequest<Blob>({
            method: 'POST',
            url: APIEndpoints.Report.TURNOVER,
            data: { ...exportParams, export: true },
            responseType: 'blob',
        });
        
        // Ensure response.data is present; throw descriptive error if not.
        if (!response || !response.data) {
            throw new Error('Export failed: no file returned from server.');
        }
        return response.data;
    }

    static async exportGameHistory(params: LedgerParams): Promise<Blob> {
        const { page, limit, ...exportParams } = params;
        
        const response = await NetworkService.privateRequest<Blob>({
            method: 'POST',
            url: APIEndpoints.Report.GAME_HISTORY,
            data: { ...exportParams, export: true },
            responseType: 'blob',
        });

        if (!response || !response.data) {
            throw new Error('Export failed: no file returned from server.');
        }
        return response.data;
    }
}

export default ReportService;
