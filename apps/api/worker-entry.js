export default {
    async fetch(request, env) {
        // 将所有请求转发到 Container
        const container = env.api;
        return container.fetch(request);
    }
};