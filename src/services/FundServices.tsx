import { APIEndpoints } from "../model/constants";
import { ApiResponse } from "../modals/Auth";
import { BalanceAdjustmentRequest, BalanceAdjustmentResponse } from "../modals/fund";
import NetworkService from './NetworkService';

class FundService {
    /**
     * Adjusts the balance of a target user (agent, sub-agent, or user).
     */
    static async adjustBalance(adjustmentData: BalanceAdjustmentRequest): Promise<ApiResponse<BalanceAdjustmentResponse>> {
        return NetworkService.privateRequest({
            method: 'POST', 
            url: APIEndpoints.fund.BALANCE_ADJUSTMENT,
            data: adjustmentData,
        });
    }
}

export default FundService;
