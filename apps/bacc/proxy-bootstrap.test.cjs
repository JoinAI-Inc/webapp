const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

test("proxy bootstrap respects NO_PROXY through EnvHttpProxyAgent", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "proxy-bootstrap.cjs"),
    "utf8"
  );
  let dispatcher;
  let envAgentCreated = false;

  class EnvHttpProxyAgent {
    constructor() {
      envAgentCreated = true;
    }
  }

  vm.runInNewContext(source, {
    process: {
      env: {
        HTTPS_PROXY: "http://host.docker.internal:7890",
        NO_PROXY: "localhost,127.0.0.1,api",
      },
    },
    require(moduleName) {
      assert.equal(moduleName, "undici");
      return {
        EnvHttpProxyAgent,
        setGlobalDispatcher(value) {
          dispatcher = value;
        },
      };
    },
    console: {
      log() {},
      warn() {},
    },
    URL,
  });

  assert.equal(envAgentCreated, true);
  assert.ok(dispatcher instanceof EnvHttpProxyAgent);
});
