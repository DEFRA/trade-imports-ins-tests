export const addressTypes = {
  originOrConsignor: 'ORIGIN_OR_CONSIGNOR',
  destinationConsigneeOrImporter: 'DESTINATION_CONSIGNEE_OR_IMPORTER',
  branch: 'BRANCH',
} as const;

export type AddressType = (typeof addressTypes)[keyof typeof addressTypes];

export const addressRoles = {
  placeOfOrigin: 'PLACE_OF_ORIGIN',
  consignor: 'CONSIGNOR',
  placeOfDestination: 'PLACE_OF_DESTINATION',
  consignee: 'CONSIGNEE',
  importer: 'IMPORTER',
  branchAddress: 'BRANCH_ADDRESS',
} as const;

export type AddressRole = (typeof addressRoles)[keyof typeof addressRoles];

export interface AddressRoles {
  roles: AddressRole[];
}

export const rolesOf = ({ roles }: { roles?: AddressRole[] }) => ({ roles });

export const heldAsPlaceOfOrigin: AddressRoles = { roles: [addressRoles.placeOfOrigin] };

export const heldAsConsignor: AddressRoles = { roles: [addressRoles.consignor] };

export const heldAsPlaceOfDestination: AddressRoles = { roles: [addressRoles.placeOfDestination] };

export const heldAsConsignee: AddressRoles = { roles: [addressRoles.consignee] };

export const heldAsImporter: AddressRoles = { roles: [addressRoles.importer] };

export const heldAsBranchAddress: AddressRoles = { roles: [addressRoles.branchAddress] };
