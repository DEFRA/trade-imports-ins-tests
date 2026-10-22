import { request, type APIRequestContext, type Browser, type WorkerInfo } from '@playwright/test';
import { createAuthState, type AuthStateFor } from '@fixtures/auth-state';
import { getAnimalsFrontendBaseUrl } from '@config/service-base-urls';

const FRONTEND_AUTH_TARGET = 'animals';

export const createFrontendSeedContext = async (
  browser: Browser,
  workerInfo: WorkerInfo,
  authStateFor: AuthStateFor | undefined,
): Promise<APIRequestContext> => {
  const baseURL = getAnimalsFrontendBaseUrl();
  // Carried through or the security profile bypasses ZAP and CDP fails TLS.
  const { proxy, ignoreHTTPSErrors } = workerInfo.project.use;

  const storageState = authStateFor
    ? await authStateFor(FRONTEND_AUTH_TARGET)
    : await createAuthState(browser, {
        targetName: FRONTEND_AUTH_TARGET,
        baseURL,
        workerIndex: workerInfo.workerIndex,
        proxy,
        ignoreHTTPSErrors,
      });

  return request.newContext({ baseURL, storageState, proxy, ignoreHTTPSErrors });
};
