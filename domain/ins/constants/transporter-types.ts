export const transporterTypes = {
  private: 'PRIVATE',
  commercial: 'COMMERCIAL',
} as const;

export type TransporterType = (typeof transporterTypes)[keyof typeof transporterTypes];

export const transporterTypeQuestion = {
  caption: 'Add a new transporter',
  title: 'Choose a transporter type',
  warning: 'Check the transporter list before adding new transporters to avoid duplicates.',
  error: 'Select what kind of transporter it is',
};

export const transporterTypeOptions: readonly { transporterType: TransporterType; label: string; hint?: string }[] = [
  { transporterType: transporterTypes.private, label: 'Private transporter' },
  {
    transporterType: transporterTypes.commercial,
    label: 'Commercial',
    hint: 'This can only be a commercial transporter from Northern Ireland.',
  },
];

export const transporterTypeLabels = Object.fromEntries(
  transporterTypeOptions.map(({ transporterType, label }) => [transporterType, label]),
) as Record<TransporterType, string>;

export const transporterAddedCaption = 'Add a new transporter';

export const transporterCancelLabel = 'Cancel and return to address book';

export const notApplicableApprovalNumber = 'Not applicable';

/** A commercial transporter's country is fixed by the ruling: the code the address book stores it
 * under, and the word both the address book and the journey show for it. */
export const COMMERCIAL_TRANSPORTER_COUNTRY_CODE = 'GB-NIR';
export const COMMERCIAL_TRANSPORTER_COUNTRY_NAME = 'Northern Ireland';
