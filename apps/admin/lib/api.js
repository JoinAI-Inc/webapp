
import axios from 'axios';

const api = axios.create({
    baseURL: '/api/admin',
});

api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_TOKEN || 'admin_secret_123'}`;
    return config;
});

export const getApps = () => api.get('/apps').then(res => res.data);
export const createApp = (data) => api.post('/apps', data).then(res => res.data);
export const updateApp = (id, data) => api.put(`/apps/${id}`, data).then(res => res.data);

export const getPlans = () => api.get('/plans').then(res => res.data);
export const createPlan = (data) => api.post('/plans', data).then(res => res.data);
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data).then(res => res.data);

export const getRevenueStats = () => api.get('/stats/revenue').then(res => res.data);
export const getOverviewStats = () => api.get('/stats/overview').then(res => res.data);

export const getUsers = () => api.get('/users').then(res => res.data);
export const getUserDetail = (id) => api.get(`/users/${id}`).then(res => res.data);
export const lockUser = (id, isLocked) => api.patch(`/users/${id}/lock`, { isLocked }).then(res => res.data);

export const getAppBlockers = (id) => api.get(`/apps/${id}/deletion-blockers`).then(res => res.data);
export const unlistApp = (id) => api.post(`/apps/${id}/unlist`).then(res => res.data);
export const disableApp = (id) => api.post(`/apps/${id}/disable`).then(res => res.data);
export const sunsetApp = (id, data) => api.post(`/apps/${id}/sunset`, data).then(res => res.data);
export const archiveApp = (id, reason) => api.post(`/apps/${id}/archive`, { reason }).then(res => res.data);
export const republishApp = (id) => api.post(`/apps/${id}/republish`).then(res => res.data);

export const getPlanBlockers = (id) => api.get(`/plans/${id}/deletion-blockers`).then(res => res.data);
export const retirePlan = (id, data) => api.post(`/plans/${id}/retire`, data).then(res => res.data);
export const archivePlan = (id, reason) => api.post(`/plans/${id}/archive`, { reason }).then(res => res.data);
export const reactivatePlan = (id) => api.post(`/plans/${id}/reactivate`).then(res => res.data);

export const syncStripeProducts = () => api.post('/stripe/sync-products').then(res => res.data);
export const reconcileStripeOrders = (days) => api.get(`/stripe/reconcile?days=${days || 30}`).then(res => res.data);
export const fixStripeMismatch = (sessionId) => api.post('/stripe/fix-mismatch', { sessionId }).then(res => res.data);
export const syncAllSubscriptions = () => api.post('/stripe/sync-subscriptions').then(res => res.data);

export const getFeatures = () => api.get('/features').then(res => res.data);
export const createFeature = (data) => api.post('/features', data).then(res => res.data);
export const updateFeature = (id, data) => api.put(`/features/${id}`, data).then(res => res.data);

export const getTemplates = (params) => api.get('/templates', { params }).then(res => res.data);
export const getTemplate = (id) => api.get(`/templates/${id}`).then(res => res.data);
export const createTemplate = (data) => api.post('/templates', data).then(res => res.data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data).then(res => res.data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`).then(res => res.data);

export const getTags = () => api.get('/tags').then(res => res.data);
export const createTag = (data) => api.post('/tags', data).then(res => res.data);
export const deleteTag = (id) => api.delete(`/tags/${id}`).then(res => res.data);

export const getAssets = () => api.get('/assets').then(res => res.data);
export const createAsset = (data) => api.post('/assets', data).then(res => res.data);
export const updateAsset = (id, data) => api.put(`/assets/${id}`, data).then(res => res.data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`).then(res => res.data);

export const getGenerationConfigOptions = () => api.get('/generation-config/options').then(res => res.data);
export const getPromptPolicies = () => api.get('/generation-config/prompt-policies').then(res => res.data);
export const createPromptPolicy = (data) => api.post('/generation-config/prompt-policies', data).then(res => res.data);
export const updatePromptPolicy = (id, data) => api.put(`/generation-config/prompt-policies/${id}`, data).then(res => res.data);

export const getSiteThemes = () => api.get('/site-themes').then(res => res.data);
export const getSiteTheme = (id) => api.get(`/site-themes/${id}`).then(res => res.data);
export const createSiteTheme = (data) => api.post('/site-themes', data).then(res => res.data);
export const updateSiteTheme = (id, data) => api.put(`/site-themes/${id}`, data).then(res => res.data);
export const deleteSiteTheme = (id) => api.delete(`/site-themes/${id}`).then(res => res.data);
export const uploadAdminImage = (data) => api.post('/uploads', data).then(res => res.data);

export default api;
