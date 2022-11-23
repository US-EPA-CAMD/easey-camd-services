import { Report } from '../entities/report.entity';
import { ReportColumnMap } from './report-column.map';
import { ReportDetailMap } from './report-detail.map';
import { ReportParameterMap } from './report-parameter.map';
import { ReportMap } from './report.map';

describe('Report Map', () => {
  it('should be defined', () => {
    expect(ReportMap).toBeDefined();
  });

  it('should map an entity to a dto', async () => {
    const reportEntity = new Report();
    reportEntity.templateCode = 'TEST';

    const map = new ReportMap(
      new ReportDetailMap(new ReportColumnMap(), new ReportParameterMap()),
    );

    const mapped = await map.one(reportEntity);

    expect(mapped.templateCode).toEqual('TEST');
  });
});
