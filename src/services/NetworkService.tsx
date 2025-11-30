// src/services/NetworkService.ts

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../modals/Auth';
import { APIEndpoints } from '../model/constants';

class NetworkService {
    private static axiosInstance = axios.create({
        baseURL: APIEndpoints.BASE_URL,
        timeout: 10000,
    });

    static async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response: AxiosResponse<any> = await this.axiosInstance.request(config);
            return {
                success: true,
                message: response.data.message || 'Request successful',
                data: response.data as T,
            };
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            let errorMessage = 'An unexpected error occurred.';
            if (axiosError.response) {
                errorMessage = axiosError.response.data?.error || `Request failed with status ${axiosError.response.status}`;
                console.error('API Error:', axiosError.response.data);
            } else if (axiosError.request) {
                errorMessage = 'Network error. Please check your connection.';
                console.error('Network Error:', axiosError.request);
            } else {
                console.error('Unexpected Error:', axiosError.message);
            }
            return {
                success: false,
                message: errorMessage,
                error: { status: false, message: errorMessage },
            };
        }
    }

    static async publicRequest<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(config);
    }

    static async privateRequest<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.error("Authentication token not found.");
            return {
                success: false,
                message: "Authentication token not found. Please log in again.",
                error: { status: false, message: "No token" },
            };
        }

        const authConfig: AxiosRequestConfig = {
            ...config,
            headers: {
                ...config.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };

        return this.request<T>(authConfig);
    }
}

export default NetworkService;