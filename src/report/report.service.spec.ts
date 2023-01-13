// import { Test } from '@nestjs/testing';
// import { LoggerModule } from '@us-epa-camd/easey-common/logger';

// import { ReportService } from './report.service';
// import { ReportRepository } from './report.repository';
// import { ReportParamsDTO } from '../dto/report-params.dto';
// import { ReportDTO } from '../dto/report.dto';
// import { createMock } from '@golevelup/ts-jest';
// import { EntityManager } from 'typeorm';

// const mockRepository = () => ({
//   getReport: jest.fn(),
// });

// const reportDto = new ReportDTO();
// reportDto.details = [];

// const mockMap = () => ({
//   one: jest.fn().mockResolvedValue(reportDto),
// });

// describe('-- Report Service --', () => {
//   let service: ReportService;

//   beforeEach(async () => {
//     const module = await Test.createTestingModule({
//       imports: [LoggerModule],
//       providers: [
//         ReportService,
//         {
//           provide: ReportRepository,
//           useFactory: mockRepository,
//         },
//       ],
//     }).compile();

//     service = module.get(ReportService);
//   });

//   it('should be defined', async () => {
//     expect(service).toBeDefined();
//   });

//   describe('getReport', () => {
//     it('calls ReportRepository.getReport() and gets Report based on param with monitorId', async () => {
//       const params = new ReportParamsDTO();
//       params.monitorPlanId = 'id';
//       params.facilityId = null;

//       const mockedManager = createMock<EntityManager>({
//         query: jest.fn().mockResolvedValue([
//           {
//             orisCode: 1,
//             stateCode: '',
//             countyName: '',
//             facilityId: '',
//             facilityName: '',
//             unitStack: 'unitStack',
//           },
//         ]),
//       });

//       jest.spyOn(service, 'returnManager').mockImplementation(() => {
//         return mockedManager;
//       });

//       expect((await service.getReport(params)).orisCode).toEqual(1);
//     });

//     it('calls ReportRepository.getReport() and gets Report based on param with facilityId', async () => {
//       const params = new ReportParamsDTO();
//       params.monitorPlanId = null;
//       params.facilityId = 1;

//       const mockedManager = createMock<EntityManager>({
//         query: jest.fn().mockResolvedValue({
//           orisCode: 1,
//           stateCode: '',
//           countyName: '',
//           facilityId: '',
//           facilityName: '',
//           unitStack: 'unitStack',
//         }),
//       });

//       jest.spyOn(service, 'returnManager').mockImplementation(() => {
//         return mockedManager;
//       });

//       expect((await service.getReport(params)).orisCode).toEqual(1);
//     });
//   });
// });
