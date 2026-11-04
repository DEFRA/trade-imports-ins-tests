import { addressTypes, addressUses, type AddressType, type AddressUse } from '@domain/shared/constants/address-types';

interface UseTexts {
  listLabel: string;
  filterText: string;
  formLabel: string;
}

const useTexts: Record<AddressUse, UseTexts> = {
  PLACE_OF_ORIGIN: { listLabel: 'Place of origin', filterText: 'Place of Origin', formLabel: 'Place of origin' },
  CONSIGNOR: { listLabel: 'Consignor', filterText: 'Consignor', formLabel: 'Consignor' },
  PLACE_OF_DESTINATION: { listLabel: 'Place of destination', filterText: 'Place of Destination', formLabel: 'Place of destination' },
  CONSIGNEE: { listLabel: 'Consignee', filterText: 'Consignee', formLabel: 'Consignee' },
  IMPORTER: { listLabel: 'Importer', filterText: 'Importer', formLabel: 'Importer' },
  BRANCH_ADDRESS: { listLabel: 'Branch', filterText: 'Branch Address', formLabel: 'Branch address' },
};

const textsOfEachUse = (textOf: (texts: UseTexts) => string): Record<AddressUse, string> =>
  Object.fromEntries(Object.entries(useTexts).map(([use, texts]) => [use, textOf(texts)])) as Record<AddressUse, string>;

export const useLabels = textsOfEachUse(({ listLabel }) => listLabel);

export const useFilterOptionTexts = textsOfEachUse(({ filterText }) => filterText);

export const usesQuestionLabels = textsOfEachUse(({ formLabel }) => formLabel);

export const useFilterPlaceholder = 'Select one';

export interface AddressBookTab {
  addressType: AddressType;
  label: string;
  panelHeading: string;
  useFilterOptions: readonly AddressUse[];
}

export const addressBookTabs: readonly AddressBookTab[] = [
  {
    addressType: addressTypes.originOrConsignor,
    label: 'Origin and Consignor',
    panelHeading: 'Origin and Consignor addresses',
    useFilterOptions: [addressUses.placeOfOrigin, addressUses.consignor],
  },
  {
    addressType: addressTypes.destinationConsigneeOrImporter,
    label: 'Destination, Consignee and Importer',
    panelHeading: 'Destination, Consignee and Importer addresses',
    useFilterOptions: [addressUses.consignee, addressUses.importer, addressUses.placeOfDestination],
  },
  {
    addressType: addressTypes.branch,
    label: 'Branch',
    panelHeading: 'Branch addresses',
    useFilterOptions: [addressUses.branchAddress],
  },
];

export const [originOrConsignorTab, destinationConsigneeOrImporterTab, branchTab] = addressBookTabs;

const tabsByAddressType: Record<AddressType, AddressBookTab> = {
  [addressTypes.originOrConsignor]: originOrConsignorTab,
  [addressTypes.destinationConsigneeOrImporter]: destinationConsigneeOrImporterTab,
  [addressTypes.branch]: branchTab,
};

export const tabOf = (addressType: AddressType): AddressBookTab => tabsByAddressType[addressType];

export const addressBookTabLabels = addressBookTabs.map(({ label }) => label);

export const unsupportedAddressValue = 'TRANSPORTER';

export const usesQuestionOptions: Record<AddressType, readonly AddressUse[]> = {
  [addressTypes.originOrConsignor]: [addressUses.placeOfOrigin, addressUses.consignor],
  [addressTypes.destinationConsigneeOrImporter]: [addressUses.placeOfDestination, addressUses.consignee, addressUses.importer],
  [addressTypes.branch]: [addressUses.branchAddress],
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

export const addressTypeQuestion = {
  error: 'Select an address type',
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
