import { APIClient } from '../api/client.js';
import { Config } from '../core/config.js';
import { Storage } from '../core/storage.js';
import {
    Plan,
    App,
    Entitlement,
    CreateCheckoutParams,
    CheckoutSessionResult,
    SubscriptionStatus,
    SubscriptionChangeCallback,
} from '../types/index.js';

export class SubscriptionManager {
    private storage: Storage;
    private apiClient: APIClient;
    private subscriptionChangeCallbacks: Set<SubscriptionChangeCallback>;
    private cachedStatus?: SubscriptionStatus;

    constructor(_config: Config, storage: Storage, apiClient: APIClient) {
        this.storage = storage;
        this.apiClient = apiClient;
        this.subscriptionChangeCallbacks = new Set();
    }

    /**
     * 获取应用的计费方案
     * @param appId 应用ID，如果不传则获取所有应用的方案
     */
    async getPlans(appId?: string): Promise<Plan[]> {
        if (appId) {
            // 获取特定应用的计费方案
            const result = await this.apiClient.get<{ app: App; plans: Plan[] }>(
                `/store/apps/${appId}`
            );
            return result.plans;
        } else {
            // 获取全局计费方案
            return this.apiClient.get<Plan[]>('/store/plans');
        }
    }

    /**
     * 创建Stripe支付会话
     * @param params 支付参数
     * @returns Stripe Checkout URL
     */
    async createCheckout(params: CreateCheckoutParams): Promise<string> {
        const user = this.storage.getUser();
        if (!user) {
            throw new Error('User must be authenticated to create checkout session');
        }

        const result = await this.apiClient.post<CheckoutSessionResult>(
            '/payment/create-checkout',
            {
                userId: user.id,
                pricingPlanId: params.planId,
                successUrl: params.successUrl,
                cancelUrl: params.cancelUrl,
            }
        );

        return result.url;
    }

    /**
     * 同步Stripe支付状态
     * 在支付成功后的回调页面调用
     * @param sessionId Stripe Session ID
     */
    async syncPaymentStatus(sessionId: string): Promise<void> {
        await this.apiClient.post('/payment/sync-session', { sessionId });
    }

    /**
     * 检查用户是否有访问权限
     * @param appId 可选，检查特定应用的访问权限
     */
    async checkAccess(appId?: string): Promise<boolean> {
        const entitlements = await this.getEntitlements();

        if (!appId) {
            // 如果未指定appId，检查是否有任何授权
            return entitlements.length > 0;
        }

        // 检查是否有全局授权
        const hasGlobalAccess = entitlements.some(
            (e) => e.scopeType === 'GLOBAL' && this.isEntitlementValid(e)
        );

        if (hasGlobalAccess) {
            return true;
        }

        // 检查是否有特定应用的授权
        const hasAppAccess = entitlements.some((e) => {
            if (e.scopeType !== 'SPECIFIC_APP') return false;
            if (!this.isEntitlementValid(e)) return false;

            // 检查是否包含目标应用
            if (e.appId === appId) return true;
            if (e.application?.id === appId) return true;
            if (e.apps?.some((a) => a.app.id === appId)) return true;

            return false;
        });

        return hasAppAccess;
    }

    /**
     * 获取用户的所有授权
     */
    async getEntitlements(): Promise<Entitlement[]> {
        return this.apiClient.get<Entitlement[]>('/store/entitlements');
    }

    /**
     * 获取用户在特定应用的授权
     * @param appId 可选，应用ID。如果不传则返回所有授权
     * @returns 过滤后的授权列表
     */
    async getEntitlementsForApp(appId?: string): Promise<Entitlement[]> {
        const allEntitlements = await this.getEntitlements();

        // 如果未指定appId，返回所有授权
        if (!appId) {
            return allEntitlements;
        }

        // 过滤出与该应用相关的授权
        return allEntitlements.filter((entitlement) => {
            // 全局授权对所有应用有效
            if (entitlement.scopeType === 'GLOBAL') {
                return true;
            }

            // 特定应用授权，检查是否包含目标应用
            if (entitlement.scopeType === 'SPECIFIC_APP') {
                // 检查多种可能的应用ID字段
                if (entitlement.appId === appId) return true;
                if (entitlement.application?.id === appId) return true;
                if (entitlement.apps?.some((a) => a.app.id === appId)) return true;
            }

            return false;
        });
    }

    /**
     * 检查授权是否有效（未过期）
     */
    private isEntitlementValid(entitlement: Entitlement): boolean {
        // 永久授权始终有效
        if (entitlement.entitlementType === 'PERMANENT') {
            return true;
        }

        // 订阅授权检查过期时间
        if (!entitlement.expireTime) {
            return false;
        }

        const expireTime = new Date(entitlement.expireTime);
        return expireTime > new Date();
    }

    /**
     * 获取所有可用应用列表
     */
    async getApps(): Promise<App[]> {
        return this.apiClient.get<App[]>('/store/apps');
    }

    /**
     * 获取应用详情
     */
    async getAppDetail(appId: string): Promise<{ app: App; plans: Plan[] }> {
        return this.apiClient.get<{ app: App; plans: Plan[] }>(`/store/apps/${appId}`);
    }

    /**
     * 验证订阅状态
     * 调用后端API获取最新的订阅信息
     */
    async validateSubscription(): Promise<SubscriptionStatus> {
        const user = this.storage.getUser();

        if (!user) {
            const emptyStatus: SubscriptionStatus = {
                isActive: false,
                hasGlobalAccess: false,
                accessibleAppIds: [],
                entitlements: [],
                timestamp: new Date().toISOString()
            };
            this.updateCachedStatus(emptyStatus);
            return emptyStatus;
        }

        try {
            const status = await this.apiClient.get<SubscriptionStatus>('/subscription/status');
            this.updateCachedStatus(status);
            return status;
        } catch (error: any) {
            console.error('Failed to validate subscription:', error);
            throw error;
        }
    }

    /**
     * 添加订阅状态变更监听器
     */
    onSubscriptionChange(callback: SubscriptionChangeCallback): () => void {
        this.subscriptionChangeCallbacks.add(callback);

        // 返回取消订阅函数
        return () => {
            this.subscriptionChangeCallbacks.delete(callback);
        };
    }

    /**
     * 检查是否应该阻止访问
     * 基于缓存的订阅状态判断
     */
    shouldBlockAccess(appId?: string): boolean {
        if (!this.cachedStatus) {
            return true; // 没有缓存状态,默认阻止访问
        }

        // 有全局授权且有效
        if (this.cachedStatus.hasGlobalAccess && this.cachedStatus.isActive) {
            return false;
        }

        // 检查特定应用的访问权限
        if (appId && this.cachedStatus.accessibleAppIds.includes(appId)) {
            return false;
        }

        return !this.cachedStatus.isActive;
    }

    /**
     * 更新缓存的状态并检测变更
     */
    private updateCachedStatus(newStatus: SubscriptionStatus): void {
        const statusChanged = this.hasStatusChanged(this.cachedStatus, newStatus);
        this.cachedStatus = newStatus;

        if (statusChanged) {
            this.notifySubscriptionChange(newStatus);
        }
    }

    /**
     * 判断订阅状态是否变更
     */
    private hasStatusChanged(
        oldStatus: SubscriptionStatus | undefined,
        newStatus: SubscriptionStatus
    ): boolean {
        if (!oldStatus) return true;

        return (
            oldStatus.isActive !== newStatus.isActive ||
            oldStatus.hasGlobalAccess !== newStatus.hasGlobalAccess ||
            oldStatus.entitlements.length !== newStatus.entitlements.length
        );
    }

    /**
     * 通知所有监听器订阅状态变更
     */
    private notifySubscriptionChange(status: SubscriptionStatus): void {
        this.subscriptionChangeCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in subscription change callback:', error);
            }
        });
    }
}
