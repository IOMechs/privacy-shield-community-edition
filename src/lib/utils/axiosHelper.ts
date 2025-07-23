import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { AppError } from "./errorClass";

// Create a class to manage the Axios instance and its configurations
class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;

  private constructor() {
    // Create axios instance with default configurations
    this.api = axios.create({
      timeout: 30000, // 30 seconds
      headers: {
        Accept: "application/json",
      },
      withCredentials: true,
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Get token from localStorage or your auth management system
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        // Handle common error scenarios
        let errMessage = error.message;
        if (error.response) {
          switch (error.response.status) {
            case 401:
              // Handle unauthorized access
              // You might want to redirect to login or refresh token
              errMessage = "Please Log in again";
              break;
            case 403:
              // Handle forbidden access
              errMessage = "You seem to not have access to this resource";
              break;
            case 404:
              // Handle not found
              errMessage = "Resource Not Found";
              break;
            case 500:
              errMessage = "Something went wrong on our servers";
              // Handle server errors
              break;
          }
        }
        const customError = new AppError(errMessage, "network", error);
        return Promise.reject(customError);
      }
    );
  }

  // Singleton pattern to ensure only one instance is created
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Generic GET method
  public async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Generic POST method
  public async post<T>(url: string, data?: any, config: any = {}): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Generic PUT method
  public async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Generic DELETE method
  public async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.api.delete<T>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Generic PATCH method
  public async patch<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Error handling method
  private handleError(error: any): void {
    // You can implement custom error logging here
    console.error("API Error:", error);
  }

  // Method to set new headers
  public setHeader(key: string, value: string): void {
    this.api.defaults.headers.common[key] = value;
  }

  // Method to get the Axios instance directly if needed
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// Export a singleton instance
export const apiService = ApiService.getInstance();
