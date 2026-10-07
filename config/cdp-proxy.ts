import { isCdpLocal } from '@utils/playwright/environment';

/** The CDP proxy sidecar, the only route from a test suite to the internet. */
const CDP_PROXY = { server: 'http://localhost:3128' };

/** Direct from a laptop (CDP_LOCAL); through the CDP proxy everywhere else. */
export const getCdpProxy = (): { server: string } | undefined => (isCdpLocal() ? undefined : CDP_PROXY);
