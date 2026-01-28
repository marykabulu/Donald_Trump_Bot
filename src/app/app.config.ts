import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

/**
 * Main application configuration
 * Sets up routing, HTTP client, and other core services
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),  // Global error handling
    provideRouter(routes),                 // Application routing
    provideClientHydration(withEventReplay()), // SSR hydration with event replay
    provideHttpClient()                    // HTTP client for API calls
  ]
};
