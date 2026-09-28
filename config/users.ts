/**
 * Defra ID stub identities used by the suite.
 * CRNs and organisations mirror trade-imports-defra-id-stub mock data.
 */
export const users = {
  andrew: {
    crn: '2100010101',
    displayName: 'Andrew Farmer',
    email: 'test.user11@defra.gov.uk',
    organisationId: '5900001',
  },
  sarah: {
    crn: '2100010102',
    displayName: 'Sarah Plumber',
    organisations: {
      /** SBI for Gatwick Airport — needed when Sarah picks among multiple orgs. */
      gatwickAirport: '110100101',
    },
  },
} as const;

/** Default signed-in identity when tests omit an explicit user. */
export const defaultUser = users.andrew;

export const defaultPassword = process.env.AUTH_PASSWORD || 'Password123';
