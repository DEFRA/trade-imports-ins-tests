export const transporters = {
  garciaLivestockTransport: { value: 'garcia-livestock-transport', display: 'García Livestock Transport SL' },
} as const;

export type Transporter = (typeof transporters)[keyof typeof transporters];

export const handTypedPrivateTransporter = (name: string) => ({
  name,
  addressLine1: '12 Rue des Fermes',
  townOrCity: 'Amiens',
  postalOrZipCode: '80000',
  country: 'France',
  telephoneNumber: '+33 3 22 55 01 44',
  emailAddress: 'jean.dupont@example.fr',
});

export const handTypedCommercialTransporter = {
  approvalNumber: 'NI/TA/2026/0041',
  name: 'Lough Neagh Livestock Haulage Ltd',
  addressLine1: '4 Shore Road',
  townOrCity: 'Antrim',
  postalOrZipCode: 'BT41 4LB',
  emailAddress: 'ops@loughneagh.example',
  telephoneNumber: '+44 28 9446 1200',
} as const;
