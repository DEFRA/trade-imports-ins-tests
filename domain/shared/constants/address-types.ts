export const addressTypes = {
  originOrConsignor: 'ORIGIN_OR_CONSIGNOR',
  destinationConsigneeOrImporter: 'DESTINATION_CONSIGNEE_OR_IMPORTER',
  transporter: 'TRANSPORTER',
  branch: 'BRANCH',
} as const;

export type AddressType = (typeof addressTypes)[keyof typeof addressTypes];

/** The address types whose add form asks the roles question: every type but Transporter, which
 * opens the add-a-transporter pages instead and carries no roles. */
export const addressTypesAskingRoles = [
  addressTypes.originOrConsignor,
  addressTypes.destinationConsigneeOrImporter,
  addressTypes.branch,
] as const;

export type AddressTypeAskingRoles = (typeof addressTypesAskingRoles)[number];

export const addressRoles = {
  placeOfOrigin: 'PLACE_OF_ORIGIN',
  consignor: 'CONSIGNOR',
  placeOfDestination: 'PLACE_OF_DESTINATION',
  consignee: 'CONSIGNEE',
  importer: 'IMPORTER',
  branchAddress: 'BRANCH_ADDRESS',
} as const;

export type AddressRole = (typeof addressRoles)[keyof typeof addressRoles];

export interface HeldRoles {
  roles: AddressRole[];
}

export const rolesFieldOf = ({ roles }: { roles?: AddressRole[] }) => ({ roles });

export const heldAsPlaceOfOrigin: HeldRoles = { roles: [addressRoles.placeOfOrigin] };

export const heldAsConsignor: HeldRoles = { roles: [addressRoles.consignor] };

export const heldAsPlaceOfDestination: HeldRoles = { roles: [addressRoles.placeOfDestination] };

export const heldAsConsignee: HeldRoles = { roles: [addressRoles.consignee] };

export const heldAsImporter: HeldRoles = { roles: [addressRoles.importer] };

export const heldAsBranchAddress: HeldRoles = { roles: [addressRoles.branchAddress] };
