// How long one generation request may run end to end. No imports, so client components can use it
// (for "is this still running or did it fail?") without pulling the Node-only fetch code into the browser.
// Keep it longer than the backend's own job timeout, or the proxy gives up while the backend still works.
export const LONG_REQUEST_TIMEOUT_MS = 30 * 60 * 1000;
