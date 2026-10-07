/**
 * A PIMS Dynamics `defraimp_importernotifications` row, typed from the Dataverse metadata of the
 * `defraimp_importernotification` table. Lookups arrive in rows as `_<name>_value`; option sets arrive
 * as their numeric code and dates as ISO strings. A column is non-null only where the table metadata
 * requires it (primary key, reference, state code, owner); every other column can be null.
 *
 * To check or update it, compare it with the table's attributes (relative to ANIMALS_DYNAMICS_URL):
 * /api/data/v9.2/EntityDefinitions(LogicalName='defraimp_importernotification')/Attributes?$select=LogicalName,AttributeType,AttributeTypeName,RequiredLevel,IsPrimaryId&$filter=AttributeOf eq null
 */
export interface AnimalsDynamicsImporterNotification {
  '@odata.etag': string;

  // Identity and status
  defraimp_aggregateversion: number | null;
  defraimp_cloned: boolean | null;
  _defraimp_devolvedoffice_value: string | null;
  defraimp_importernotificationid: string;
  defraimp_imptype: string | null;
  _defraimp_imptypeid_value: string | null;
  defraimp_ipaffsid: number | null;
  defraimp_ismatched: boolean | null;
  defraimp_mrnnumber: string | null;
  defraimp_name: string;
  defraimp_pimsstatus: number | null;
  defraimp_processstatus: number | null;
  defraimp_purposeofconsignment: number | null;
  defraimp_status: number | null;
  defraimp_traderreference: string | null;
  defraimp_type: number | null;
  defraimp_version: number | null;
  statecode: number;
  statuscode: number | null;

  // Submission and audit
  defraimp_datecompleted: string | null;
  defraimp_dateemailsent: string | null;
  defraimp_datetelephonecallmade: string | null;
  defraimp_lastupdated: string | null;
  defraimp_lastupdatedbydisplayname: string | null;
  defraimp_lastupdatedbyuserid: string | null;
  defraimp_submissiondate: string | null;
  defraimp_submittedbydisplayname: string | null;
  defraimp_submittedbyiscontroluser: boolean | null;
  defraimp_submittedbyuserid: string | null;

  // Importer
  defraimp_importeraddressaddressline1: string | null;
  defraimp_importeraddressaddressline2: string | null;
  defraimp_importeraddressaddressline3: string | null;
  defraimp_importeraddresscity: string | null;
  _defraimp_importeraddresscountryid_value: string | null;
  defraimp_importeraddresscountryisocode: string | null;
  defraimp_importeraddressemail: string | null;
  defraimp_importeraddresspostalzipcode: string | null;
  defraimp_importeraddresstelephone: string | null;
  defraimp_importeraddressuktelephone: string | null;
  defraimp_importerapprovalnumber: string | null;
  defraimp_importercompanyname: string | null;
  defraimp_importerid: string | null;
  defraimp_importerindividualname: string | null;
  defraimp_importerinternationalphonecode: string | null;
  defraimp_importerinternationalphonenumber: string | null;
  defraimp_importerotheridentifier: string | null;
  defraimp_importerstatus: string | null;
  defraimp_importertype: string | null;

  // Consignor
  defraimp_consignoraddressaddressline1: string | null;
  defraimp_consignoraddressaddressline2: string | null;
  defraimp_consignoraddressaddressline3: string | null;
  defraimp_consignoraddresscity: string | null;
  _defraimp_consignoraddresscountryid_value: string | null;
  defraimp_consignoraddresscountryisocode: string | null;
  defraimp_consignoraddressemail: string | null;
  defraimp_consignoraddresspostalzipcode: string | null;
  defraimp_consignoraddresstelephone: string | null;
  defraimp_consignoraddressuktelephone: string | null;
  defraimp_consignorapprovalnumber: string | null;
  defraimp_consignorcompanyname: string | null;
  defraimp_consignorid: string | null;
  defraimp_consignorindividualname: string | null;
  defraimp_consignorinternationalphonecode: string | null;
  defraimp_consignorinternationalphonenumber: string | null;
  defraimp_consignorotheridentifier: string | null;
  defraimp_consignorstatus: string | null;
  defraimp_consignortype: string | null;

  // Consignor two
  defraimp_consignortwoaddressaddressline1: string | null;
  defraimp_consignortwoaddressaddressline2: string | null;
  defraimp_consignortwoaddressaddressline3: string | null;
  defraimp_consignortwoaddresscity: string | null;
  _defraimp_consignortwoaddresscountry_value: string | null;
  defraimp_consignortwoaddresscountryisocode: string | null;
  defraimp_consignortwoaddressemail: string | null;
  defraimp_consignortwoaddresspostalzipcode: string | null;
  defraimp_consignortwoaddresstelephone: string | null;
  defraimp_consignortwoaddressuktelephone: string | null;
  defraimp_consignortwoapprovalnumber: string | null;
  defraimp_consignortwocompanyname: string | null;
  defraimp_consignortwoid: string | null;
  defraimp_consignortwoindividualname: string | null;
  defraimp_consignortwointernationalphonecode: string | null;
  defraimp_consignortwointernationalphonenumber: string | null;
  defraimp_consignortwootheridentifier: string | null;
  defraimp_consignortwostatus: string | null;
  defraimp_consignortwotype: string | null;

  // Consignee
  defraimp_consigneeaddressaddressline1: string | null;
  defraimp_consigneeaddressaddressline2: string | null;
  defraimp_consigneeaddressaddressline3: string | null;
  defraimp_consigneeaddresscity: string | null;
  _defraimp_consigneeaddresscountryid_value: string | null;
  defraimp_consigneeaddresscountryisocode: string | null;
  defraimp_consigneeaddressemail: string | null;
  defraimp_consigneeaddresspostalzipcode: string | null;
  defraimp_consigneeaddresstelephone: string | null;
  defraimp_consigneeaddressuktelephone: string | null;
  defraimp_consigneeapprovalnumber: string | null;
  defraimp_consigneecompanyname: string | null;
  defraimp_consigneeid: string | null;
  defraimp_consigneeindividualname: string | null;
  defraimp_consigneeinternationalphonecode: string | null;
  defraimp_consigneeinternationalphonenumber: string | null;
  defraimp_consigneeotheridentifier: string | null;
  defraimp_consigneestatus: string | null;
  defraimp_consigneetype: string | null;

  // Transporter
  defraimp_transporteraddressaddressline1: string | null;
  defraimp_transporteraddressaddressline2: string | null;
  defraimp_transporteraddressaddressline3: string | null;
  defraimp_transporteraddresscity: string | null;
  _defraimp_transporteraddresscountryid_value: string | null;
  defraimp_transporteraddresscountryisocode: string | null;
  defraimp_transporteraddressemail: string | null;
  defraimp_transporteraddresspostalzipcode: string | null;
  defraimp_transporteraddresstelephone: string | null;
  defraimp_transporteraddressuktelephone: string | null;
  defraimp_transporterapprovalnumber: string | null;
  defraimp_transportercompanyname: string | null;
  defraimp_transporterdetailsrequired: boolean | null;
  defraimp_transporterid: string | null;
  defraimp_transporterindividualname: string | null;
  defraimp_transporterinternationalphonecode: string | null;
  defraimp_transporterinternationalphonenumber: string | null;
  defraimp_transporterotheridentifier: string | null;
  defraimp_transporterstatus: string | null;
  defraimp_transportertype: string | null;

  // Place of origin
  defraimp_placeoforiginaddressline1: string | null;
  defraimp_placeoforiginaddressline2: string | null;
  defraimp_placeoforigincity: string | null;
  defraimp_placeoforigincompanyname: string | null;
  _defraimp_placeoforigincountryid_value: string | null;
  defraimp_placeoforiginemail: string | null;
  defraimp_placeoforiginphone: string | null;
  defraimp_placeoforiginpostcode: string | null;

  // Place of origin harvest
  defraimp_placeoforiginharvestaddressaddressline1: string | null;
  defraimp_placeoforiginharvestaddressaddressline2: string | null;
  defraimp_placeoforiginharvestaddressaddressline3: string | null;
  defraimp_placeoforiginharvestaddresscity: string | null;
  _defraimp_placeoforiginharvestaddresscountryid_value: string | null;
  defraimp_placeoforiginharvestaddresscountryisocode: string | null;
  defraimp_placeoforiginharvestaddressemail: string | null;
  defraimp_placeoforiginharvestaddresspostalzipcode: string | null;
  defraimp_placeoforiginharvestaddresstelephone: string | null;
  defraimp_placeoforiginharvestaddressuktelephone: string | null;
  defraimp_placeoforiginharvestapprovalnumber: string | null;
  defraimp_placeoforiginharvestcompanyname: string | null;
  defraimp_placeoforiginharvestid: string | null;
  defraimp_placeoforiginharvestindividualname: string | null;
  defraimp_placeoforiginharvestintphonecode: string | null;
  defraimp_placeoforiginharvestintphonenumber: string | null;
  defraimp_placeoforiginharvestotheridentifier: string | null;
  defraimp_placeoforiginharveststatus: string | null;
  defraimp_placeoforiginharvesttype: string | null;

  // Place of destination
  defraimp_placeofdestinationaddressaddressline1: string | null;
  defraimp_placeofdestinationaddressaddressline2: string | null;
  defraimp_placeofdestinationaddressaddressline3: string | null;
  defraimp_placeofdestinationaddresscity: string | null;
  defraimp_placeofdestinationaddresscountryisocode: string | null;
  defraimp_placeofdestinationaddressemail: string | null;
  defraimp_placeofdestinationaddresspostalzipcode: string | null;
  defraimp_placeofdestinationaddresstelephone: string | null;
  defraimp_placeofdestinationaddressuktelephone: string | null;
  defraimp_placeofdestinationapprovalnumber: string | null;
  defraimp_placeofdestinationcompanyname: string | null;
  _defraimp_placeofdestinationcountryid_value: string | null;
  defraimp_placeofdestinationid: string | null;
  defraimp_placeofdestinationindividualname: string | null;
  defraimp_placeofdestinationintphonecode: string | null;
  defraimp_placeofdestinationintphonenumber: string | null;
  defraimp_placeofdestinationotheridentifier: string | null;
  defraimp_placeofdestinationstatus: string | null;
  defraimp_placeofdestinationtype: string | null;

  // Person responsible
  _defraimp_irmspersonresponsible_value: string | null;
  defraimp_personresponsibleaddress: string | null;
  defraimp_personresponsiblecity: string | null;
  defraimp_personresponsiblecompanyid: string | null;
  defraimp_personresponsiblecompanyname: string | null;
  defraimp_personresponsiblecontactid: string | null;
  defraimp_personresponsiblecountry: string | null;
  _defraimp_personresponsiblecountryid_value: string | null;
  defraimp_personresponsiblecounty: string | null;
  defraimp_personresponsibleemail: string | null;
  defraimp_personresponsiblefax: string | null;
  defraimp_personresponsibleid: string | null;
  defraimp_personresponsiblename: string | null;
  defraimp_personresponsiblephone: string | null;
  defraimp_personresponsiblepostcode: string | null;
  defraimp_personresponsibletype: string | null;

  // Journey
  defraimp_arrivaldate: string | null;
  defraimp_arrivaltime: string | null;
  _defraimp_consignedcountryid_value: string | null;
  _defraimp_countryoforiginid_value: string | null;
  defraimp_cphnumber: string | null;
  defraimp_departuredate: string | null;
  defraimp_departuretime: string | null;
  defraimp_estimatedjourneytimeinminutes: number | null;
  defraimp_exitbordercontrolpost: string | null;
  defraimp_exitbordercontrolpostdate: string | null;
  defraimp_isplaceofdestinationthepermanentaddress: boolean | null;
  defraimp_meansoftransportfromentrypointdocument: string | null;
  defraimp_meansoftransportfromentrypointid: string | null;
  defraimp_meansoftransportfromentrypointtype: string | null;
  defraimp_meansoftransporttoentrypointdocument: string | null;
  defraimp_meansoftransporttoentrypointid: string | null;
  defraimp_meansoftransporttoentrypointtype: string | null;
  defraimp_portofentry: string | null;
  defraimp_portofexit: string | null;
  defraimp_portofexitdate: string | null;
  defraimp_responsiblefortransport: string | null;
  defraimp_routetransitingstates: string | null;
  _defraimp_transitdestinationcountryid_value: string | null;

  // Compliance
  defraimp_caseworkerintervention: boolean | null;
  defraimp_contactedduetononcompliance: boolean | null;
  defraimp_healthcertificateattached: boolean | null;
  defraimp_importingfromcharity: boolean | null;
  defraimp_inspectionrequired: number | null;
  defraimp_isnoncompliantcalculated: boolean | null;
  defraimp_noncomplianceothercomments: string | null;
  defraimp_noncompliancestatus: number | null;
  defraimp_typeofnoncompliance: number | null;
  defraimp_veterinaryinformationveterinarydocument: string | null;

  // Commodity
  defraimp_commoditiesanimalscertifiedas: number | null;
  defraimp_commoditiescertifiedfor: number | null;
  defraimp_commoditiescommodityintendedfor: string | null;
  defraimp_commoditiesconsignedcountry: string | null;
  defraimp_commoditiescountryoforigin: string | null;
  defraimp_commoditiesincludenonablactedanimals: boolean | null;
  defraimp_commoditiesinternalmarketpurpose: number | null;
  defraimp_commoditiesnumberofanimals: number | null;
  defraimp_commoditiesnumberofpackages: number | null;
  defraimp_commoditiesregionoforigin: string | null;
  defraimp_commoditiestotalgrossweight: number | null;
  defraimp_commoditiestotalnetweight: number | null;
  defraimp_commoditycomplementid: number | null;
  defraimp_commoditycomplementname: string | null;
  defraimp_commoditycomplementstext: string | null;
  defraimp_commoditydescription: string | null;
  defraimp_commodityid: string | null;
  defraimp_commodityidtypes: string | null;
  defraimp_commodityspeciesclass: string | null;
  defraimp_commodityspeciesclassname: string | null;
  defraimp_commodityspeciescommonname: string | null;
  defraimp_commodityspeciesid: string | null;
  defraimp_commodityspeciesname: string | null;
  defraimp_commodityspeciesnomination: string | null;
  defraimp_commodityspeciestype: string | null;
  defraimp_complexcommodityselected: boolean | null;
  defraimp_formattedcommoditycomplementstext: string | null;
  defraimp_formattedidentificationofanimalstext: string | null;
  defraimp_hasmultiplecommoditycodes: boolean | null;
  defraimp_identificationofanimalstext: string | null;
  defraimp_speciesdetails: string | null;
  defraimp_weight: string | null;

  // System and ownership
  _createdby_value: string | null;
  createdon: string | null;
  _createdonbehalfby_value: string | null;
  defraimp_quickviewspacer: string | null;
  importsequencenumber: number | null;
  _modifiedby_value: string | null;
  modifiedon: string | null;
  _modifiedonbehalfby_value: string | null;
  overriddencreatedon: string | null;
  _ownerid_value: string;
  _owningbusinessunit_value: string | null;
  _owningteam_value: string | null;
  _owninguser_value: string | null;
  timezoneruleversionnumber: number | null;
  utcconversiontimezonecode: number | null;
  versionnumber: number | null;
}
