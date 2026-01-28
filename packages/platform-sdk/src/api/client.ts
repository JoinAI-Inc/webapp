import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../core/config.js';
import { Storage } from '../core/storage.js';

export class APIClient {
    private client: AxiosInstance;
    private storage: Storage;
    private onUnauthorized?: () => void;

    constructor(config: Config, storage: Storage) {
        this.storage = storage;

        this.client = axios.create({
            baseURL: config.apiBaseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 请求拦截器：注入Token
        this.client.interceptors.request.use((config) => {
            const token = this.storage.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // 响应拦截器：处理401
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    this.storage.clear();
                    if (this.onUnauthorized) {
                        this.onUnauthorized();
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    setUnauthorizedHandler(handler: () => void): void {
        this.onUnauthorized = handler;
    }

    // 通用请求方法
    async get<T>(url: string, params?: any): Promise<T> {
        const response = await this.client.get<T>(url, { params });
        return response.data;
    }

    async post<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.post<T>(url, data);
        return response.data;
    }

    async put<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.put<T>(url, data);
        return response.data;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<T>(url);
        return response.data;
    }
}
