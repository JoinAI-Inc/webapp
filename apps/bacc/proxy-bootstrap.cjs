const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy ||
  process.env.ALL_PROXY ||
  process.env.all_proxy;

if (proxyUrl) {
  try {
    const { ProxyAgent, setGlobalDispatcher } = require("undici");

    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    console.log(`[Proxy] Outbound HTTP proxy enabled: ${new URL(proxyUrl).host}`);
  } catch (error) {
    console.warn("[Proxy] Failed to enable outbound HTTP proxy", error);
  }
}
