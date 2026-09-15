export const SERVICE_WORKER_URL = "/sw.js";

const noop = () => undefined;

/**
 * Registers the service worker that downloads and caches the Semaphore
 * artifacts (`public/sw.js`, generated from `public/service-worker.js` by
 * `pnpm build`).
 *
 * Called from a React effect, i.e. after hydration. Hydration regularly
 * finishes after the window `load` event has already fired (always in
 * `next dev`, and in production on slow devices), so a bare `load` listener
 * would never run and the worker would never be registered. Register right
 * away when the document has already finished loading and otherwise wait for
 * `load`, so the download does not compete with the page's own resources.
 *
 * Returns a cleanup function that removes the pending `load` listener.
 */
export function registerServiceWorker(): () => void {
  if (!("serviceWorker" in navigator)) {
    return noop;
  }

  const register = () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_URL)
      .catch((error: unknown) => {
        console.error(
          `Service worker registration failed for ${SERVICE_WORKER_URL}; Semaphore artifacts will not be cached:`,
          error,
        );
      });
  };

  if (document.readyState === "complete") {
    register();
    return noop;
  }

  window.addEventListener("load", register, { once: true });
  return () => window.removeEventListener("load", register);
}
