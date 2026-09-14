import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import {
  registerServiceWorker,
  SERVICE_WORKER_URL,
} from "../src/lib/register-service-worker";

// #region Browser fakes (no DOM library; the helper only touches these globals)
type LoadListener = () => void;

const browserGlobals = ["window", "document", "navigator"] as const;
const originalDescriptors = browserGlobals.map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
);

function installBrowser({
  readyState,
  register = async (_url: string) => ({}),
  supported = true,
}: {
  readyState: DocumentReadyState;
  register?: (url: string) => Promise<unknown>;
  supported?: boolean;
}) {
  const loadListeners = new Set<LoadListener>();
  const registerMock = mock.fn(register);
  const fakeWindow = {
    addEventListener: (type: string, listener: LoadListener) => {
      if (type === "load") loadListeners.add(listener);
    },
    removeEventListener: (type: string, listener: LoadListener) => {
      if (type === "load") loadListeners.delete(listener);
    },
  };
  const fakeNavigator = supported
    ? { serviceWorker: { register: registerMock } }
    : {};

  for (const [name, value] of [
    ["window", fakeWindow],
    ["document", { readyState }],
    ["navigator", fakeNavigator],
  ] as const) {
    Object.defineProperty(globalThis, name, {
      value,
      configurable: true,
      writable: true,
    });
  }

  return {
    loadListeners,
    registerMock,
    fireLoad() {
      for (const listener of [...loadListeners]) {
        loadListeners.delete(listener); // registered with `{ once: true }`
        listener();
      }
    },
  };
}

afterEach(() => {
  mock.restoreAll();
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as Record<string, unknown>)[name];
  }
});

const flushPromises = async () =>
  new Promise((resolve) => setTimeout(resolve, 0));
// #endregion

test("registers immediately when the window load event has already fired", () => {
  const browser = installBrowser({ readyState: "complete" });

  const cleanup = registerServiceWorker();

  assert.equal(browser.registerMock.mock.callCount(), 1);
  assert.deepEqual(browser.registerMock.mock.calls[0].arguments, [
    SERVICE_WORKER_URL,
  ]);
  assert.equal(browser.loadListeners.size, 0);
  cleanup();
});

test("waits for the window load event while the document is still loading", () => {
  const browser = installBrowser({ readyState: "interactive" });

  registerServiceWorker();

  assert.equal(browser.registerMock.mock.callCount(), 0);
  assert.equal(browser.loadListeners.size, 1);

  browser.fireLoad();

  assert.equal(browser.registerMock.mock.callCount(), 1);
  assert.deepEqual(browser.registerMock.mock.calls[0].arguments, [
    SERVICE_WORKER_URL,
  ]);
});

test("cleanup removes a pending load listener", () => {
  const browser = installBrowser({ readyState: "loading" });

  const cleanup = registerServiceWorker();
  cleanup();

  assert.equal(browser.loadListeners.size, 0);
  browser.fireLoad();
  assert.equal(browser.registerMock.mock.callCount(), 0);
});

test("reports a failed registration with context instead of throwing", async () => {
  const failure = new Error(
    "A bad HTTP response code (404) was received when fetching the script.",
  );
  const browser = installBrowser({
    readyState: "complete",
    register: async () => {
      throw failure;
    },
  });
  const consoleError = mock.method(console, "error", () => {});

  registerServiceWorker();
  await flushPromises();

  assert.equal(browser.registerMock.mock.callCount(), 1);
  assert.equal(consoleError.mock.callCount(), 1);
  const [message, error] = consoleError.mock.calls[0].arguments;
  assert.match(String(message), /\/sw\.js/);
  assert.equal(error, failure);
});

test("does nothing when the browser has no service worker support", () => {
  const browser = installBrowser({ readyState: "complete", supported: false });

  const cleanup = registerServiceWorker();
  cleanup();

  assert.equal(browser.registerMock.mock.callCount(), 0);
  assert.equal(browser.loadListeners.size, 0);
});
