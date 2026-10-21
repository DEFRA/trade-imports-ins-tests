import { request, type APIRequestContext, type Browser, type WorkerInfo } from '@playwright/test';
import { createAuthState, type AuthStateFor } from '@fixtures/auth-state';
import { getAnimalsFrontendBaseUrl } from '@config/service-base-urls';

const FRONTEND_AUTH_TARGET = 'animals';

type SeedContextOptions = Pick<WorkerInfo['project']['use'], 'proxy' | 'ignoreHTTPSErrors'>;

export const signInFrontendSeedState = (
  browser: Browser,
  workerInfo: WorkerInfo,
  authStateFor: AuthStateFor | undefined,
): Promise<string> => {
  const { proxy, ignoreHTTPSErrors } = workerInfo.project.use;

  return authStateFor
    ? authStateFor(FRONTEND_AUTH_TARGET)
    : createAuthState(browser, {
        targetName: FRONTEND_AUTH_TARGET,
        baseURL: getAnimalsFrontendBaseUrl(),
        workerIndex: workerInfo.workerIndex,
        proxy,
        ignoreHTTPSErrors,
      });
};

// Carry proxy and ignoreHTTPSErrors through, or the security profile bypasses ZAP and CDP fails TLS.
export const createFrontendSeedContext = (
  storageState: string,
  { proxy, ignoreHTTPSErrors }: SeedContextOptions,
): Promise<APIRequestContext> => request.newContext({ baseURL: getAnimalsFrontendBaseUrl(), storageState, proxy, ignoreHTTPSErrors });
