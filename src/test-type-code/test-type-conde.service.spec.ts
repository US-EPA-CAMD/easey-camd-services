import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { TestTypeCodeService } from './test-type-code.service';

describe('TestTypeCodeService', () => {
  let service: TestTypeCodeService;
  let mockEntityManager: Partial<EntityManager>;

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
      ],
    }).compile();

    service = module.get(TestTypeCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return data only from test type code', async () => {

     const mockTestTypeCodes = [{ id: 'Rata', name: 'Test Rata' }, { id: 'Line', name: 'Test Line' }];
    (mockEntityManager.find as jest.Mock).mockResolvedValue(mockTestTypeCodes);


    let result = await service.findAll();

    expect(result).toEqual(mockTestTypeCodes);
   
  });

});
