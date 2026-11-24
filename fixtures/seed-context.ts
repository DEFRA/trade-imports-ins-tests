import { chromium, request, type APIRequestContext, type LaunchOptions, type WorkerInfo } from '@playwright/test';
import { createAuthState, type AuthMint, type AuthStateFor } from '@fixtures/auth-state';
import { getAnimalsFrontendBaseUrl } from '@config/service-base-urls';

const FRONTEND_AUTH_TARGET = 'animals';

const createAuthStateInNewBrowser = async (mint: AuthMint, launchOptions: LaunchOptions | undefined): Promise<string> => {
  const browser = await chromium.launch(launchOptions);
  try {
    return await createAuthState(browser, mint);
  } finally {
    await browser.close();
  }
};

export const createFrontendSeedContext = async (
  workerInfo: WorkerInfo,
  authStateFor: AuthStateFor | undefined,
): Promise<APIRequestContext> => {
  const baseURL = getAnimalsFrontendBaseUrl();
  // Carried through or the security profile bypasses ZAP and CDP fails TLS.
  const { proxy, ignoreHTTPSErrors, launchOptions } = workerInfo.project.use;

  const storageState = authStateFor
    ? await authStateFor(FRONTEND_AUTH_TARGET)
    : await createAuthStateInNewBrowser(
        {
          targetName: FRONTEND_AUTH_TARGET,
          baseURL,
          workerIndex: workerInfo.workerIndex,
          proxy,
          ignoreHTTPSErrors,
        },
        launchOptions,
      );

  return request.newContext({ baseURL, storageState, proxy, ignoreHTTPSErrors });
};
