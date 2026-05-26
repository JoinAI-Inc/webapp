// Usage相关的类型定义

export interface Feature {
    id: string;
    featureKey: string;
    appId: string;
    name: string;
    description?: string;
    chargingType?: 'COUNT' | 'TOGGLE';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    app?: {
        id: string;
        name: string;
        appKey: string;
    };
}

export interface UserBalance {
    id: string;
    userId: string;
    featureId: string;
    remainingCount: number;
    totalPurchased: number;
    totalUsed: number;
    lastUsedAt?: string;
    createdAt: string;
    updatedAt: string;
    feature: Feature;
}

export interface AccessCheckResult {
    hasAccess: boolean;
    source: 'SUBSCRIPTION' | 'USAGE_PACK' | null;
    remainingCount?: number;
    unlimited?: boolean;
}

export interface UsagePack {
    id: string;
    pricingPlanId: string;
    featureId: string;
    usageCount: number;
    feature: Feature;
}
