import { faker } from '@faker-js/faker';

export const genErrorSuppressions = <RepoType>(amount = 1): RepoType[] => {
  const errorSuppressions: RepoType[] = [];
  for (
    let errorSuppressionsCount = 0;
    errorSuppressionsCount < amount;
    errorSuppressionsCount++
  ) {
    errorSuppressions.push({
      id: faker.number.int(),
      checkCatalogResultId: faker.number.int(),
      checkTypeCode: faker.string.sample(),
      checkNumber: faker.number.int(),
      checkResultCode: faker.string.sample(),
      severityCode: faker.string.sample(),
      facilityId: faker.number.int(),
      orisCode: faker.number.int(),
      locations: faker.string.sample(),
      matchDataTypeCode: faker.string.sample(),
      matchDataValue: faker.string.sample(),
      matchTimeTypeCode: faker.date.anytime(),
      matchTimeBeginValue: faker.date.anytime(),
      matchTimeEndValue: faker.date.anytime(),
      matchHistoricalInd: faker.datatype.boolean(),
      reasonCode: faker.string.sample(),
      note: faker.string.sample(),
      active: faker.datatype.boolean(),
      userId: faker.date.anytime(),
      addDate: faker.date.anytime(),
      updateDate: faker.date.anytime(),
    } as unknown as RepoType);
  }
  return errorSuppressions;
};
