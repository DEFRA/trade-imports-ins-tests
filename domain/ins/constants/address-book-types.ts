import { addressTypes, addressRoles, type AddressType, type AddressRole } from '@domain/shared/constants/address-types';

interface RoleTexts {
  columnLabel: string;
  optionLabel: string;
  formLabel: string;
}

const roleTexts: Record<AddressRole, RoleTexts> = {
  PLACE_OF_ORIGIN: { columnLabel: 'Place of origin', optionLabel: 'Place of Origin', formLabel: 'Place of origin' },
  CONSIGNOR: { columnLabel: 'Consignor', optionLabel: 'Consignor', formLabel: 'Consignor' },
  PLACE_OF_DESTINATION: { columnLabel: 'Place of destination', optionLabel: 'Place of Destination', formLabel: 'Place of destination' },
  CONSIGNEE: { columnLabel: 'Consignee', optionLabel: 'Consignee', formLabel: 'Consignee' },
  IMPORTER: { columnLabel: 'Importer', optionLabel: 'Importer', formLabel: 'Importer' },
  BRANCH_ADDRESS: { columnLabel: 'Branch', optionLabel: 'Branch Address', formLabel: 'Branch address' },
};

const textsOfEachRole = (textOf: (texts: RoleTexts) => string): Record<AddressRole, string> =>
  Object.fromEntries(Object.entries(roleTexts).map(([role, texts]) => [role, textOf(texts)])) as Record<AddressRole, string>;

export const roleColumnLabels = textsOfEachRole(({ columnLabel }) => columnLabel);

export const roleOptionLabels = textsOfEachRole(({ optionLabel }) => optionLabel);

export const rolesQuestionLabels = textsOfEachRole(({ formLabel }) => formLabel);

export const roleFilterPlaceholder = 'Select one';

export interface AddressBookTab {
  addressType: AddressType;
  label: string;
  panelHeading: string;
  roleFilterOptions: readonly AddressRole[];
}

export const addressBookTabs: readonly AddressBookTab[] = [
  {
    addressType: addressTypes.originOrConsignor,
    label: 'Origin and Consignor',
    panelHeading: 'Origin and Consignor addresses',
    roleFilterOptions: [addressRoles.placeOfOrigin, addressRoles.consignor],
  },
  {
    addressType: addressTypes.destinationConsigneeOrImporter,
    label: 'Destination, Consignee and Importer',
    panelHeading: 'Destination, Consignee and Importer addresses',
    roleFilterOptions: [addressRoles.consignee, addressRoles.importer, addressRoles.placeOfDestination],
  },
  {
    addressType: addressTypes.branch,
    label: 'Branch',
    panelHeading: 'Branch addresses',
    roleFilterOptions: [addressRoles.branchAddress],
  },
];

export const [originOrConsignorTab, destinationConsigneeOrImporterTab, branchTab] = addressBookTabs;

const tabsByAddressType: Record<AddressType, AddressBookTab> = {
  [addressTypes.originOrConsignor]: originOrConsignorTab,
  [addressTypes.destinationConsigneeOrImporter]: destinationConsigneeOrImporterTab,
  [addressTypes.branch]: branchTab,
};

export const tabOf = (addressType: AddressType): AddressBookTab => tabsByAddressType[addressType];

export const tabHolding = (role: AddressRole): AddressBookTab => {
  const tab = addressBookTabs.find(({ roleFilterOptions }) => roleFilterOptions.includes(role));
  if (!tab) {
    throw new Error(`Expected a tab holding the role ${role}`);
  }
  return tab;
};

export const addressBookTabLabels = addressBookTabs.map(({ label }) => label);

export const unsupportedAddressValue = 'TRANSPORTER';

export const rolesQuestionOptions: Record<AddressType, readonly AddressRole[]> = {
  [addressTypes.originOrConsignor]: [addressRoles.placeOfOrigin, addressRoles.consignor],
  [addressTypes.destinationConsigneeOrImporter]: [addressRoles.placeOfDestination, addressRoles.consignee, addressRoles.importer],
  [addressTypes.branch]: [addressRoles.branchAddress],
};

export const addressTypesRequiringUnitedKingdom: readonly AddressType[] = [
  addressTypes.destinationConsigneeOrImporter,
  addressTypes.branch,
];

const hintOf = (addressType: AddressType): string => rolesQuestionOptions[addressType].map((role) => rolesQuestionLabels[role]).join(', ');

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

export const rolesQuestion = {
  hint: 'Select where this address can be used',
  error: 'Select what this address can be used for',
};

export const rolesQuestionLegends: Record<AddressType, string> = {
  ORIGIN_OR_CONSIGNOR: 'What can this address be used for?',
  DESTINATION_CONSIGNEE_OR_IMPORTER: 'Address type',
  BRANCH: 'Address type',
};

export const journeyRolesQuestion = {
  legend: 'What else should this address be used for?',
  consigneeHint: 'This address is being added as a Consignee address. Select any other roles or addresses this address should be used for.',
};
