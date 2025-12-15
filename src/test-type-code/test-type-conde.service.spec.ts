jest.mock('@us-epa-camd/easey-common/connection', () => ({
  withSlaveConnection: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager, DataSource } from 'typeorm';
import { TestTypeCodeService } from './test-type-code.service';

const mockWithSlaveConnection = require('@us-epa-camd/easey-common/connection').withSlaveConnection;

describe('TestTypeCodeService', () => {
  let service: TestTypeCodeService;
  let mockEntityManager: Partial<EntityManager>;

  //beforeEach(async () => {
    const mockTestTypeCodes = [
      { id: 'Rata', name: 'Test Rata' },
      { id: 'Line', name: 'Test Line' }
    ];

    beforeEach(async () => {
    mockWithSlaveConnection.mockImplementation(async (dataSource, operation) => {
      const mockManager = {
        query: jest.fn().mockResolvedValue([]),
        find: jest.fn().mockResolvedValue(mockTestTypeCodes),
        findBy: jest.fn().mockResolvedValue([]),
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
          findBy: jest.fn().mockResolvedValue([]),
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      return await operation(mockManager);
    });
  });

  beforeEach(async () => {
     mockEntityManager = {
      find: jest.fn() as jest.MockedFunction<typeof mockEntityManager.find>,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestTypeCodeService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: DataSource,
          useValue: {},
        }
      ],
    }).compile();

    service = module.get(TestTypeCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data only from test type code', async () => {

    //const mockTestTypeCodes = [{ id: 'Rata', name: 'Test Rata' }, { id: 'Line', name: 'Test Line' }];

    let result = await service.findAll();

    expect(result).toEqual(mockTestTypeCodes);
   
  });

});
