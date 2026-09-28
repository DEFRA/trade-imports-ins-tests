import { request, type APIRequestContext, type Browser, type WorkerInfo } from '@playwright/test';
import { createAuthState } from '@fixtures/auth-state';
import { getAnimalsFrontendBaseUrl } from '@config/service-base-urls';

const FRONTEND_AUTH_TARGET = 'e2e';

export const createFrontendSeedContext = async (
  browser: Browser,
  workerInfo: WorkerInfo,
  projectAuthState: string | undefined,
): Promise<APIRequestContext> => {
  const baseURL = getAnimalsFrontendBaseUrl();
  // Carried through or the security profile bypasses ZAP and CDP fails TLS.
  const { proxy, ignoreHTTPSErrors, baseURL: projectBaseUrl } = workerInfo.project.use;

  const alreadyOnTheFrontend = projectAuthState !== undefined && projectBaseUrl === baseURL;
  const storageState = alreadyOnTheFrontend
    ? projectAuthState
    : await createAuthState(browser, {
        targetName: FRONTEND_AUTH_TARGET,
        baseURL,
        workerIndex: workerInfo.workerIndex,
        proxy,
        ignoreHTTPSErrors,
      });

  return request.newContext({ baseURL, storageState, proxy, ignoreHTTPSErrors });
};
