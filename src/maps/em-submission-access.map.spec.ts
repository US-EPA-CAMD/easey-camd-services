import { EmSubmissionAccessMap } from './em-submission-access.map';
import { genEmSubmissionAccess } from '../../test/object-generators/em-submission-access';
import { EmSubmissionAccessView } from '../entities/em-submission-access-vw.entity';
import { currentDateTime } from '@us-epa-camd/easey-common/utilities/functions';

describe('EmSubmissionAccessMap', () => {
  let map: EmSubmissionAccessMap;

  beforeAll(() => {
    map = new EmSubmissionAccessMap();
  });

  it('should map values correctly', async function () {
    const mocks = genEmSubmissionAccess(3);

    const expectOne = async (mock: EmSubmissionAccessView) => {
      let status;
      if (
        mock?.submissionAvailabilityCode === 'GRANTED' ||
          mock?.submissionAvailabilityCode === 'REQUIRE'
      ) {
        status = 'OPEN';
      } else if (
        mock?.emissionStatusCode === 'PENDING'
      ) {
        status = 'PENDING';
      } else if (
        (mock?.emissionStatusCode === null && mock?.closeDate < currentDateTime()) ||
        (mock?.emissionStatusCode !== 'PENDING' && !['GRANTED','REQUIRE', 'DELETE'].includes(mock?.submissionAvailabilityCode))
      ) {
        status = 'CLOSED';
      } else if (
        mock?.submissionAvailabilityCode === 'DELETE'
      ) {
        status = 'CANCELLED';
      }else if (
        mock?.submissionAvailabilityCode === null && mock?.closeDate >= currentDateTime()
      ) {
        status = 'NOT YET OPEN';
      }
      await expect(map.one(mock)).resolves.toEqual({
        id: mock.id,
        facilityId: mock?.facilityId,
        facilityName: mock?.facilityName,
        orisCode: mock?.orisCode,
        monitorPlanId: mock?.monitorPlanId,
        state: mock?.state,
        locations: mock?.locations,
        reportingPeriodId: mock?.reportingPeriodId,
        reportingFrequencyCode: mock?.reportingFrequencyCode,
        reportingPeriodAbbreviation: mock?.reportingPeriodAbbreviation,
        status: status,
        openDate: mock?.openDate,
        closeDate: mock?.closeDate,
        emissionStatusCode: mock?.emissionStatusCode ?? null,
        emissionStatusDescription: mock?.emissionStatusDescription ?? null,
        submissionAvailabilityCode: mock?.submissionAvailabilityCode ?? null,
        submissionAvailabilityDescription: mock?.submissionAvailabilityDescription ?? null,
        submissionTypeCode: mock?.submissionTypeCode ?? null,
        submissionTypeDescription: mock?.submissionTypeDescription ?? null,
        lastSubmissionId: mock?.lastSubmissionId,
        severityLevel: mock?.severityLevel,
        resubExplanation: mock?.resubExplanation,
        userid: mock?.userid,
        addDate: mock?.addDate,
        updateDate: mock?.updateDate,
      });
    };

    await Promise.all(
      mocks.map((mock) => {
        return expectOne(mock as unknown as EmSubmissionAccessView);
      }),
    );
  });
});
