import { faker } from '@faker-js/faker';

export const genSubmissionList = <RepoType>(amount = 1): RepoType[] => {
  const submissionList: RepoType[] = [];
  for (
    let submissionListCount = 0;
    submissionListCount < amount;
    submissionListCount++
  ) {
    submissionList.push({
      orisCode :  faker.datatype.number(),
      facilityName :  faker.datatype.string(),
      state :  faker.datatype.string(),
      locations :  faker.datatype.string(),
      reportingPeriodAbbreviation :  faker.datatype.string(),
      reportingFrequencyCode :  faker.datatype.string(),
      submissionTypeCode :  faker.datatype.string(),
      submissionId :  faker.datatype.number(),
      submissionDateTime :  faker.datatype.datetime(),
      severityLevel :  faker.datatype.string(),
      mostRecet :  faker.datatype.string(),
      submissionCode :  faker.datatype.string(),
      severityCode :  faker.datatype.string(),
      criticalErrLevelOne :  faker.datatype.string(),
      criticalErrLevelTwo :  faker.datatype.string(),
      nonCritical :  faker.datatype.string(),
      infoMessage :  faker.datatype.string(),
      adminOverride :  faker.datatype.string(),
      submitter :  faker.datatype.string()
    } as unknown as RepoType);
  }
  return submissionList;
};
