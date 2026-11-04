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

export interface AddressClassification {
  addressType: AddressType;
  uses: AddressUse[];
}

export const classificationOf = ({ addressType, uses }: { addressType?: AddressType; uses?: AddressUse[] }) => ({ addressType, uses });

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
