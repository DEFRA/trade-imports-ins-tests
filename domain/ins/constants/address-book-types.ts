import {
  addressTypes,
  addressRoles,
  type AddressType,
  type AddressRole,
  type AddressTypeAskingRoles,
} from '@domain/shared/constants/address-types';
import { transporterTypes, type TransporterType } from './transporter-types';

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

export const rolesLabelOf = (roles: readonly AddressRole[]): string => roles.map((role) => roleColumnLabels[role]).join(', ');

export const roleOptionLabels = textsOfEachRole(({ optionLabel }) => optionLabel);

export const rolesQuestionLabels = textsOfEachRole(({ formLabel }) => formLabel);

export const typeFilterPlaceholder = 'Select one';

export const transporterTypeOptionLabels: Record<TransporterType, string> = {
  [transporterTypes.commercial]: 'Commercial',
  [transporterTypes.private]: 'Private',
};

/** Every tab carries its address type, its label and its panel heading; a role-backed tab's Type
 * filter offers its roles, and the Transporter tab's offers its transporter types. */
export interface AddressBookTab {
  addressType: AddressType;
  label: string;
  panelHeading: string;
  roleFilterOptions?: readonly AddressRole[];
  typeFilterOptions?: readonly TransporterType[];
}

/** A tab that lists by role: its address type is one that asks the roles question, and its role
 * filter options are always present. */
export type RoleBackedAddressBookTab = Omit<AddressBookTab, 'addressType' | 'roleFilterOptions'> & {
  addressType: AddressTypeAskingRoles;
  roleFilterOptions: readonly AddressRole[];
};

export const originOrConsignorTab: RoleBackedAddressBookTab = {
  addressType: addressTypes.originOrConsignor,
  label: 'Origin and Consignor',
  panelHeading: 'Origin and Consignor addresses',
  roleFilterOptions: [addressRoles.placeOfOrigin, addressRoles.consignor],
};

export const destinationConsigneeOrImporterTab: RoleBackedAddressBookTab = {
  addressType: addressTypes.destinationConsigneeOrImporter,
  label: 'Destination, Consignee and Importer',
  panelHeading: 'Destination, Consignee and Importer addresses',
  roleFilterOptions: [addressRoles.consignee, addressRoles.importer, addressRoles.placeOfDestination],
};

export const transporterTab: AddressBookTab = {
  addressType: addressTypes.transporter,
  label: 'Transporter',
  panelHeading: 'Transporter addresses',
  typeFilterOptions: [transporterTypes.commercial, transporterTypes.private],
};

export const branchTab: RoleBackedAddressBookTab = {
  addressType: addressTypes.branch,
  label: 'Branch',
  panelHeading: 'Branch addresses',
  roleFilterOptions: [addressRoles.branchAddress],
};

export const addressBookTabs: readonly AddressBookTab[] = [
  originOrConsignorTab,
  destinationConsigneeOrImporterTab,
  transporterTab,
  branchTab,
];

/** The tabs that list by role, for a loop that only makes sense against one. */
export const roleBackedAddressBookTabs: readonly RoleBackedAddressBookTab[] = [
  originOrConsignorTab,
  destinationConsigneeOrImporterTab,
  branchTab,
];

export const tabHolding = (role: AddressRole): RoleBackedAddressBookTab => {
  const tab = roleBackedAddressBookTabs.find(({ roleFilterOptions }) => roleFilterOptions.includes(role));
  if (!tab) {
    throw new Error(`Expected a tab holding the role ${role}`);
  }
  return tab;
};

export const addressBookTabLabels = addressBookTabs.map(({ label }) => label);

/** A value that is neither a member of the address type values nor a tab any of them opens, for a
 * test proving an unknown tab falls back to the default. */
export const unsupportedAddressType = 'UNSUPPORTED_ADDRESS_TYPE';

/** A value that is neither a member of the role values nor a role any address type groups, for a
 * test proving a role outside the six is refused. */
export const unsupportedRole = 'UNSUPPORTED_ROLE';

export const rolesQuestionOptions: Record<AddressTypeAskingRoles, readonly AddressRole[]> = {
  [addressTypes.originOrConsignor]: [addressRoles.placeOfOrigin, addressRoles.consignor],
  [addressTypes.destinationConsigneeOrImporter]: [addressRoles.placeOfDestination, addressRoles.consignee, addressRoles.importer],
  [addressTypes.branch]: [addressRoles.branchAddress],
};

export const addressTypesRequiringUnitedKingdom: readonly AddressTypeAskingRoles[] = [
  addressTypes.destinationConsigneeOrImporter,
  addressTypes.branch,
];

const hintOf = (addressType: AddressTypeAskingRoles): string =>
  rolesQuestionOptions[addressType].map((role) => rolesQuestionLabels[role]).join(', ');

export const addressTypeOptions: readonly { addressType: AddressType; label: string; hint: string }[] = [
  { addressType: addressTypes.originOrConsignor, label: 'Origin or Consignor', hint: hintOf(addressTypes.originOrConsignor) },
  {
    addressType: addressTypes.destinationConsigneeOrImporter,
    label: 'Destination, Consignee or Importer',
    hint: hintOf(addressTypes.destinationConsigneeOrImporter),
  },
  { addressType: addressTypes.transporter, label: 'Transporter', hint: 'Private, Commercial' },
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

export const rolesQuestionLegends: Record<AddressTypeAskingRoles, string> = {
  ORIGIN_OR_CONSIGNOR: 'What can this address be used for?',
  DESTINATION_CONSIGNEE_OR_IMPORTER: 'Address type',
  BRANCH: 'Address type',
};

export const journeyRolesQuestion = {
  legend: 'What else should this address be used for?',
  consigneeHint: 'This address is being added as a Consignee address. Select any other roles or addresses this address should be used for.',
};
