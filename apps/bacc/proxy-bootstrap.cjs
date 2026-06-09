const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy ||
  process.env.ALL_PROXY ||
  process.env.all_proxy;

if (proxyUrl) {
  try {
    const { EnvHttpProxyAgent, setGlobalDispatcher } = require("undici");
    const noProxy = process.env.NO_PROXY || process.env.no_proxy || "";

    setGlobalDispatcher(new EnvHttpProxyAgent());
    console.log(
      `[Proxy] Outbound HTTP proxy enabled: ${new URL(proxyUrl).host}; NO_PROXY=${noProxy}`
    );
  } catch (error) {
    console.warn("[Proxy] Failed to enable outbound HTTP proxy", error);
  }
}
