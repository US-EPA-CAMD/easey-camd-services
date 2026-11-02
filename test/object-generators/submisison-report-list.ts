import { faker } from '@faker-js/faker';

export const genSubmissionList = <RepoType>(amount = 1): RepoType[] => {
  const submissionList: RepoType[] = [];
  for (
    let submissionListCount = 0;
    submissionListCount < amount;
    submissionListCount++
  ) {
    submissionList.push({
      orisCode :  faker.number.int(),
      facilityName :  faker.string.sample(),
      state :  faker.string.sample(),
      locations :  faker.string.sample(),
      reportingPeriodAbbreviation :  faker.string.sample(),
      reportingFrequencyCode :  faker.string.sample(),
      submissionTypeCode :  faker.string.sample(),
      submissionId :  faker.number.int(),
      submissionDateTime :  faker.date.anytime(),
      severityLevel :  faker.string.sample(),
      mostRecent :  faker.string.sample(),
      submissionStatus :  faker.string.sample(),
      severityCode :  faker.string.sample(),
      submitter :  faker.string.sample()
    } as unknown as RepoType);
  }
  return submissionList;
};
