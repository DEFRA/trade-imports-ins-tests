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

export const addressTypeOptions: readonly { addressType: AddressType; label: string; hint: string }[] = [
  { addressType: addressTypes.originOrConsignor, label: 'Origin or Consignor', hint: 'Place of origin, Consignor' },
  {
    addressType: addressTypes.destinationConsigneeOrImporter,
    label: 'Destination, Consignee or Importer',
    hint: 'Place of destination, Consignee, Importer',
  },
  { addressType: addressTypes.branch, label: 'Branch', hint: 'Branch address' },
];

export const addressTypeLabels = Object.fromEntries(addressTypeOptions.map(({ addressType, label }) => [addressType, label])) as Record<
  AddressType,
  string
>;
