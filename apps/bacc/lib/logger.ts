/**
 * 安全日志工具
 * 支持环境变量控制和敏感数据脱敏
 */

// 日志级别配置
const LOG_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true' ||
    process.env.NODE_ENV === 'development';

// 敏感字段列表
const SENSITIVE_FIELDS = [
    'password',
    'token',
    'jwt',
    'backendJwt',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization'
];

/**
 * 脱敏函数 - 隐藏敏感数据
 */
function redactSensitiveData(data: any, maxLength = 8): any {
    if (!data) return data;

    // 处理字符串
    if (typeof data === 'string') {
        if (data.length <= maxLength) {
            return '***';
        }
        return `${data.substring(0, 3)}...${data.substring(data.length - 3)}`;
    }

    // 处理数组
    if (Array.isArray(data)) {
        return data.map(item => redactSensitiveData(item, maxLength));
    }

    // 处理对象
    if (typeof data === 'object') {
        const redacted: any = {};
        for (const [key, value] of Object.entries(data)) {
            // 检查字段名是否是敏感字段
            const isSensitive = SENSITIVE_FIELDS.some(field =>
                key.toLowerCase().includes(field.toLowerCase())
            );

            if (isSensitive && value) {
                redacted[key] = '***REDACTED***';
            } else {
                redacted[key] = redactSensitiveData(value, maxLength);
            }
        }
        return redacted;
    }

    return data;
}

/**
 * 安全日志函数
 */
export const logger = {
    /**
     * 开发调试日志 - 仅在开发环境或DEBUG模式下输出
     */
    debug: (message: string, data?: any) => {
        if (!LOG_ENABLED) return;

        if (data) {
            const redacted = redactSensitiveData(data);
            console.log(`[DEBUG] ${message}`, redacted);
        } else {
            console.log(`[DEBUG] ${message}`);
        }
    },

    /**
     * 信息日志 - 始终输出,但会脱敏
     */
    info: (message: string, data?: any) => {
        if (data) {
            const redacted = redactSensitiveData(data);
            console.log(`[INFO] ${message}`, redacted);
        } else {
            console.log(`[INFO] ${message}`);
        }
    },

    /**
     * 警告日志 - 始终输出,但会脱敏
     */
    warn: (message: string, data?: any) => {
        if (data) {
            const redacted = redactSensitiveData(data);
            console.warn(`[WARN] ${message}`, redacted);
        } else {
            console.warn(`[WARN] ${message}`);
        }
    },

    /**
     * 错误日志 - 始终输出,但会脱敏
     */
    error: (message: string, error?: any) => {
        if (error) {
            // 对于错误对象,保留 message 和 stack,但脱敏其他字段
            const redacted = {
                message: error.message || error,
                stack: LOG_ENABLED ? error.stack : undefined,
                ...redactSensitiveData(error)
            };
            console.error(`[ERROR] ${message}`, redacted);
        } else {
            console.error(`[ERROR] ${message}`);
        }
    }
};

// 导出脱敏函数供其他模块使用
export { redactSensitiveData };
