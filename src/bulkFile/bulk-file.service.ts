import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileDTO } from '../dto/bulk_file.dto';
import { BulkFileInputDTO } from '../dto/bulk_file_input.dto';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileMap } from '../maps/bulk-file-map';
import { BulkFileMetadata } from '../entities/bulk-file-metadata.entity';
import { BulkFileCopyParamsDTO } from '../dto/bulk-file-copy.params.dto';
import { BulkFileGAFTPCopyService } from './bulk-file-gaftp-copy.service';
import { BulkFileGaftpCopyRepository } from './bulk-file-gaftp-copy.repository';
import { SftpLog } from '../entities/sftp-log.entity';

const directoryInformation = {
  ['EDR']: {
    url: 'https://gaftp.epa.gov/dmdnload/edr/',
    prefix: 'edr/',
    description: 'Electronic data reporting (EDR) file',
    dataType: 'EDR',
    subType: null,
  },
  ['EM']: {
    url: 'https://gaftp.epa.gov/dmdnload/xml/em/',
    prefix: 'xml/em/',
    description: 'Emissions file',
    dataType: 'XML',
    subType: 'Emissions',
  },
  ['QA']: {
    url: 'https://gaftp.epa.gov/dmdnload/xml/qa/',
    prefix: 'xml/qa/',
    description: 'Quality Assurance file',
    dataType: 'XML',
    subType: 'QA',
  },
  ['MP']: {
    description: 'Monitoring plan file',
    dataType: 'XML',
    subType: 'Monitoring Plan',
  },
};

@Injectable()
export class BulkFileService {
  constructor(
    @InjectRepository(BulkFileMetadataRepository)
    private readonly repository: BulkFileMetadataRepository,

    @InjectRepository(BulkFileGaftpCopyRepository)
    private readonly sftpRepository: BulkFileGaftpCopyRepository,

    private readonly map: BulkFileMap,
    private readonly logger: Logger,
    private bulkFileGaftpCopyService: BulkFileGAFTPCopyService,
  ) {}

  async getBulkDataFiles(): Promise<BulkFileDTO[]> {
    return this.map.many(await this.repository.find());
  }

  async verifyBulkFiles(params: BulkFileCopyParamsDTO, id) {
    this.logger.info(`Verifying ${params.type} data`);

    const logRecord = new SftpLog();
    logRecord.id = id;
    logRecord.startDate = new Date();

    await this.sftpRepository.insert(logRecord);

    let directoryInfo;
    const directory = directoryInformation[params.type];

    if (params.type !== 'MP') {
      directoryInfo = await this.bulkFileGaftpCopyService.generateSubUrls(
        params,
        directory.url,
        directory.prefix,
        id,
      );
    } else {
      directoryInfo = [
        {
          url: 'https://gaftp.epa.gov/dmdnload/xml/mp/',
          fileNamePrefix: 'xml/mp/',
          quarter: null,
          year: null,
        },
      ];
    }

    for (const row of directoryInfo) {
      await this.bulkFileGaftpCopyService.compareObjects(row, id);
    }

    await this.sftpRepository.update(
      { id: id },
      { endDate: new Date(), statusCd: 'COMPLETE' },
    );

    this.logger.info(`Succesfully verified ${params.type} data to S3`);

    return true;
  }

  async copyBulkFiles(params: BulkFileCopyParamsDTO, id) {
    this.logger.info(`Copying ${params.type} data to S3`);

    const logRecord = new SftpLog();
    logRecord.id = id;
    logRecord.startDate = new Date();

    await this.sftpRepository.insert(logRecord);

    let directoryInfo;
    const directory = directoryInformation[params.type];

    if (params.type !== 'MP') {
      directoryInfo = await this.bulkFileGaftpCopyService.generateSubUrls(
        params,
        directory.url,
        directory.prefix,
        id,
      );
    } else {
      directoryInfo = [
        {
          url: 'https://gaftp.epa.gov/dmdnload/xml/mp/',
          fileNamePrefix: 'xml/mp/',
          quarter: null,
          year: null,
        },
      ];
    }

    for (const row of directoryInfo) {
      const fileData = await this.bulkFileGaftpCopyService.generateFileData(
        row,
        id,
      );

      if (fileData && fileData.length > 0) {
        await this.bulkFileGaftpCopyService.uploadFilesToS3(
          fileData,
          directory.dataType,
          directory.subType,
          id,
        );
      }
    }

    await this.sftpRepository.update(
      { id: id },
      { endDate: new Date(), statusCd: 'COMPLETE' },
    );

    this.logger.info(`Succesfully copied ${params.type} data to S3`);
    return true;
  }

  async addBulkDataFile(bulkFileDTO: BulkFileInputDTO): Promise<BulkFileDTO> {
    const find = await this.repository.findOne({ s3Path: bulkFileDTO.s3Path });
    if (find) {
      return this.updateBulkDataFile(find.s3Path, bulkFileDTO);
    } else {
      const today = new Date();
      const databaseInput = new BulkFileMetadata();

      databaseInput.filename = bulkFileDTO.filename;
      databaseInput.s3Path = bulkFileDTO.s3Path;
      databaseInput.metadata = JSON.stringify(bulkFileDTO.metadata);
      databaseInput.fileSize = bulkFileDTO.bytes;
      databaseInput.addDate = today;
      databaseInput.lastUpdateDate = today;

      await this.repository.insert(databaseInput);
      return this.map.one(
        await this.repository.findOne({ s3Path: bulkFileDTO.s3Path }),
      );
    }
  }

  async updateBulkDataFile(
    s3Path: string,
    bulkFileDTO: BulkFileInputDTO,
  ): Promise<BulkFileDTO> {
    const databaseinput = await this.repository.findOne(s3Path);
    databaseinput.filename = bulkFileDTO.filename;
    databaseinput.s3Path = bulkFileDTO.s3Path;
    databaseinput.metadata = JSON.stringify(bulkFileDTO.metadata);
    databaseinput.fileSize = bulkFileDTO.bytes;
    databaseinput.lastUpdateDate = new Date();
    await this.repository.update(databaseinput.filename, databaseinput);

    return this.map.one(databaseinput);
  }
}
