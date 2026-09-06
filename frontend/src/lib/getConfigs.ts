// Base URL of the backend API.
//
// The value is derived from BACKEND_PORT in the repo-root .env at build time
// (see vite.config.ts) and injected here as `__BACKEND_URL__`. Only this URL is
// injected — no other .env values (Mongo credentials, etc.) reach the browser.
declare const __BACKEND_URL__: string;

export const BACKEND_URL: string = __BACKEND_URL__;
