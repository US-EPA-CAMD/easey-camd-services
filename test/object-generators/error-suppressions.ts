import { faker } from '@faker-js/faker';

export const genErrorSuppressions = <RepoType>(amount = 1): RepoType[] => {
  const errorSuppressions: RepoType[] = [];
  for (
    let errorSuppressionsCount = 0;
    errorSuppressionsCount < amount;
    errorSuppressionsCount++
  ) {
    errorSuppressions.push({
      id: faker.datatype.number(),
      checkCatalogResultId: faker.datatype.number(),
      checkTypeCode: faker.datatype.string(),
      checkNumber: faker.datatype.number(),
      checkResultCode: faker.datatype.string(),
      severityCode: faker.datatype.string(),
      facilityId: faker.datatype.number(),
      orisCode: faker.datatype.number(),
      locations: faker.datatype.string(),
      matchDataTypeCode: faker.datatype.string(),
      matchDataValue: faker.datatype.string(),
      matchTimeTypeCode: faker.datatype.datetime(),
      matchTimeBeginValue: faker.datatype.datetime(),
      matchTimeEndValue: faker.datatype.datetime(),
      matchHistoricalInd: faker.datatype.boolean(),
      reasonCode: faker.datatype.string(),
      note: faker.datatype.string(),
      active: faker.datatype.boolean(),
      userId: faker.datatype.datetime(),
      addDate: faker.datatype.datetime(),
      updateDate: faker.datatype.datetime(),
    } as unknown as RepoType);
  }
  return errorSuppressions;
};
