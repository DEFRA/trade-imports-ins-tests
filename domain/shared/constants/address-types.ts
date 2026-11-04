export const addressTypes = {
  originOrConsignor: 'ORIGIN_OR_CONSIGNOR',
  destinationConsigneeOrImporter: 'DESTINATION_CONSIGNEE_OR_IMPORTER',
  branch: 'BRANCH',
} as const;

export type AddressType = (typeof addressTypes)[keyof typeof addressTypes];

export const addressUses = {
  placeOfOrigin: 'PLACE_OF_ORIGIN',
  consignor: 'CONSIGNOR',
  placeOfDestination: 'PLACE_OF_DESTINATION',
  consignee: 'CONSIGNEE',
  importer: 'IMPORTER',
  branchAddress: 'BRANCH_ADDRESS',
} as const;

export type AddressUse = (typeof addressUses)[keyof typeof addressUses];

export const useLabels: Record<AddressUse, string> = {
  PLACE_OF_ORIGIN: 'Place of origin',
  CONSIGNOR: 'Consignor',
  PLACE_OF_DESTINATION: 'Place of destination',
  CONSIGNEE: 'Consignee',
  IMPORTER: 'Importer',
  BRANCH_ADDRESS: 'Branch',
};

export const typeOptionTexts: Record<AddressUse, string> = {
  PLACE_OF_ORIGIN: 'Place of Origin',
  CONSIGNOR: 'Consignor',
  PLACE_OF_DESTINATION: 'Place of Destination',
  CONSIGNEE: 'Consignee',
  IMPORTER: 'Importer',
  BRANCH_ADDRESS: 'Branch Address',
};

export const typeOptionPlaceholder = 'Select one';

export interface AddressBookTab {
  addressType: AddressType;
  label: string;
  panelHeading: string;
  typeOptions: readonly AddressUse[];
}

export const addressBookTabs: readonly AddressBookTab[] = [
  {
    addressType: addressTypes.originOrConsignor,
    label: 'Origin and Consignor',
    panelHeading: 'Origin and Consignor addresses',
    typeOptions: [addressUses.placeOfOrigin, addressUses.consignor],
  },
  {
    addressType: addressTypes.destinationConsigneeOrImporter,
    label: 'Destination, Consignee and Importer',
    panelHeading: 'Destination, Consignee and Importer addresses',
    typeOptions: [addressUses.consignee, addressUses.importer, addressUses.placeOfDestination],
  },
  {
    addressType: addressTypes.branch,
    label: 'Branch',
    panelHeading: 'Branch addresses',
    typeOptions: [addressUses.branchAddress],
  },
];

export const [originOrConsignorTab, destinationConsigneeOrImporterTab, branchTab] = addressBookTabs;

export const addressBookTabLabels = addressBookTabs.map(({ label }) => label);

export const unsupportedAddressValue = 'TRANSPORTER';

export const usesQuestionOptions: Record<AddressType, readonly AddressUse[]> = {
  ORIGIN_OR_CONSIGNOR: [addressUses.placeOfOrigin, addressUses.consignor],
  DESTINATION_CONSIGNEE_OR_IMPORTER: [addressUses.placeOfDestination, addressUses.consignee, addressUses.importer],
  BRANCH: [addressUses.branchAddress],
};

export const usesQuestionLabels: Record<AddressUse, string> = {
  PLACE_OF_ORIGIN: 'Place of origin',
  CONSIGNOR: 'Consignor',
  PLACE_OF_DESTINATION: 'Place of destination',
  CONSIGNEE: 'Consignee',
  IMPORTER: 'Importer',
  BRANCH_ADDRESS: 'Branch address',
};

export const addressTypesRequiringUnitedKingdom: readonly AddressType[] = [
  addressTypes.destinationConsigneeOrImporter,
  addressTypes.branch,
];

const hintOf = (addressType: AddressType): string => usesQuestionOptions[addressType].map((use) => usesQuestionLabels[use]).join(', ');

export const addressTypeOptions: readonly { addressType: AddressType; label: string; hint: string }[] = [
  { addressType: addressTypes.originOrConsignor, label: 'Origin or Consignor', hint: hintOf(addressTypes.originOrConsignor) },
  {
    addressType: addressTypes.destinationConsigneeOrImporter,
    label: 'Destination, Consignee or Importer',
    hint: hintOf(addressTypes.destinationConsigneeOrImporter),
  },
  { addressType: addressTypes.branch, label: 'Branch', hint: hintOf(addressTypes.branch) },
];

export const addressTypeLabels = Object.fromEntries(addressTypeOptions.map(({ addressType, label }) => [addressType, label])) as Record<
  AddressType,
  string
>;

export interface AddressClassification {
  addressType: AddressType;
  uses: AddressUse[];
}

export const heldAsPlaceOfOrigin: AddressClassification = {
  addressType: addressTypes.originOrConsignor,
  uses: [addressUses.placeOfOrigin],
};

export const heldAsConsignor: AddressClassification = {
  addressType: addressTypes.originOrConsignor,
  uses: [addressUses.consignor],
};

export const heldAsPlaceOfDestination: AddressClassification = {
  addressType: addressTypes.destinationConsigneeOrImporter,
  uses: [addressUses.placeOfDestination],
};

export const heldAsConsignee: AddressClassification = {
  addressType: addressTypes.destinationConsigneeOrImporter,
  uses: [addressUses.consignee],
};

export const heldAsImporter: AddressClassification = {
  addressType: addressTypes.destinationConsigneeOrImporter,
  uses: [addressUses.importer],
};

export const heldAsBranchAddress: AddressClassification = {
  addressType: addressTypes.branch,
  uses: [addressUses.branchAddress],
};

export const usesQuestion = {
  hint: 'Select where this address can be used',
  error: 'Select what this address can be used for',
};

export const usesQuestionLegends: Record<AddressType, string> = {
  ORIGIN_OR_CONSIGNOR: 'What can this address be used for?',
  DESTINATION_CONSIGNEE_OR_IMPORTER: 'Address type',
  BRANCH: 'Address type',
};

export const journeyUsesQuestion = {
  legend: 'What else should this address be used for?',
  consigneeHint: 'This address is being added as a Consignee address. Select any other roles or addresses this address should be used for.',
};
