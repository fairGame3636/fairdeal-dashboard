import { APIEndpoints } from '../model/constants'; // Assuming your API constants are here
import { ApiResponse } from '../modals/Auth'; // Assuming a generic ApiResponse type
import { DashboardApiResponse } from '../modals/Dashboard';
import NetworkService from './NetworkService'; // Your centralized API request handler

class DashboardService 
{
    static async getDashboardData(): Promise<ApiResponse<DashboardApiResponse>> {
        return NetworkService.privateRequest({
            method: 'GET', // The route is a GET request
            url: APIEndpoints.Dashboard.GET_DATA, // e.g., '/api/dashboard'
        });
    }
}

export default DashboardService;
