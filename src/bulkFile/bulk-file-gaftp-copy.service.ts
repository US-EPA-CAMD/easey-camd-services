import axios from 'axios';
import { stat, createWriteStream, readFileSync } from 'fs';
import { load } from 'cheerio';
import { HttpStatus, Injectable } from '@nestjs/common';
import { LoggingException } from '@us-epa-camd/easey-common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileCopyParamsDTO } from '../dto/bulk-file-copy.params.dto';
import { BulkFileCopyDirectoryGenerationDTO } from '../dto/bulk-file-copy-directory-generation.dto';
import { BulkFileCopyFileGenerationDTO } from '../dto/bulk-file-copy-file-generation.dto';
import { getManager } from 'typeorm';
import { Plant } from '../entities/plant.entity';
import { BulkFileMetadata } from '../entities/bulk-file-metadata.entity';
import { S3, S3ClientConfig } from '@aws-sdk/client-s3';
import { BulkFileGaftpCopyRepository } from './bulk-file-gaftp-copy.repository';
import { Agent } from 'https';

axios.defaults.headers.common = {
  'x-api-key': process.env.EASEY_CAMD_SERVICES_API_KEY,
};

const quarterString = ['q1', 'q2', 'q3', 'q4'];

@Injectable()
export class BulkFileGAFTPCopyService {
  private s3Client;

  constructor(
    @InjectRepository(BulkFileMetadataRepository)
    private readonly repository: BulkFileMetadataRepository,

    @InjectRepository(BulkFileGaftpCopyRepository)
    private readonly sftpRepository: BulkFileGaftpCopyRepository,

    private readonly logger: Logger,
  ) {
    const s: S3ClientConfig = {};
    this.s3Client = new S3({
      region: process.env.EASEY_CAMD_SERVICES_S3_REGION,
    });
  }

  private async logError(error, id) {
    const logRecord = await this.sftpRepository.findOne(id);

    let errors;
    if (logRecord.errors && logRecord.errors !== '') {
      errors = JSON.parse(logRecord.errors);
      errors = [...errors, error];
    } else {
      errors = [];
    }

    logRecord.errors = JSON.stringify(errors);

    await this.sftpRepository.update({ id: id }, { errors: logRecord.errors });
  }

  public async uploadFilesToS3(fileInformation, dataType, subType, id) {
    await this.sftpRepository.update(
      { id: id },
      {
        details: `Uploading Files ${dataType}-${subType}`,
      },
    );
    for (const fileData of fileInformation) {
      try {
        const res = await axios.get(fileData.download, {
          /*
          httpsAgent: new Agent({
            rejectUnauthorized: false,
          }),
          */
          responseType: 'stream',
        }); //

        if (res.status == 200) {
          res.data.pipe(
            createWriteStream('src/bulkFile/writeLocation/file.zip'),
          );

          let writing = true;
          res.data.on('end', () => {
            writing = false;
          });

          while (writing) {
            await new Promise((f) => setTimeout(f, 1));
          }

          await new Promise((f) => setTimeout(f, 1000));

          const meta = {
            dataType: dataType,
            year: fileData.year,
          };

          let description;

          switch (subType) {
            case 'Emissions':
              description = `Emissions file submitted by facility ID ${fileData.facilityId} for ${fileData.year} quarter ${fileData.quarter} under Part 75`;
              break;
            case 'QA':
              description = `Quality Assurance file submitted by facility ID ${fileData.facilityId} for ${fileData.year} quarter ${fileData.quarter} under Part 75`;
              break;
            case 'Monitoring Plan':
              description = `Monitoring plan file submitted by facility ID ${fileData.facilityId} under Part 75`;
              break;
            default:
              description = `Electronic data reporting (EDR) file submitted by facility ID ${fileData.facilityId} for Part 75 reporting for ${fileData.year} quarter ${fileData.quarter}`;
              break;
          }

          meta['description'] = description;

          if (fileData.stateCode) meta['stateCode'] = fileData.stateCode;
          if (fileData.quarter) meta['quarter'] = fileData.quarter;
          if (subType) meta['dataSubType'] = subType;

          const fileParts = fileData.name.split('/');
          const fileName = fileParts[fileParts.length - 1];

          stat('src/bulkFile/writeLocation/file.zip', async (error, stats) => {
            if (error) {
              this.logger.info(error.message);
            } else {
              const bulkFileMeta = new BulkFileMetadata();
              bulkFileMeta.fileName = fileName;
              bulkFileMeta.s3Path = fileData.name;
              bulkFileMeta.metadata = JSON.stringify(meta);
              bulkFileMeta.fileSize = stats.size;
              bulkFileMeta.addDate = new Date(Date.now());
              bulkFileMeta.lastUpdateDate = new Date(Date.now());

              if (await this.repository.findOne(fileName)) {
                await this.repository.update(fileName, bulkFileMeta);
              } else {
                await this.repository.insert(bulkFileMeta);
              }
            }
          });

          await this.s3Client.putObject({
            Bucket: process.env.EASEY_CAMD_SERVICES_S3_BUCKET,
            Key: fileData.name,
            Body: readFileSync('src/bulkFile/writeLocation/file.zip'),
          });
        }
      } catch (err) {
        await this.logError(err.message, id);
        this.logger.info(err.message);
      }
    }
  }

  public async generateFileData(lookupData, id) {
    const entityManager = getManager();

    try {
      // Get initial Edr landing page and parse out all years

      await this.sftpRepository.update(
        { id: id },
        {
          details: `Generating File Data ${lookupData.year} ${lookupData.quarter} ${lookupData.fileNamePrefix}`,
        },
      );

      const { data } = await axios.get(lookupData.url, {
        /*
        httpsAgent: new Agent({
          rejectUnauthorized: false,
        }),
        */
      });

      const $ = load(data);
      const listItems = $('tbody tr td a');

      const zipFiles = [];
      for (const el of listItems) {
        const row = new BulkFileCopyFileGenerationDTO();
        const name = $(el).text();

        const orisCode = parseInt(name.split('_')[0]);

        if (!isNaN(orisCode)) {
          const result = await entityManager.findOne(Plant, {
            orisCode: orisCode,
          });

          if (!result) {
            await this.logError(
              `Missing Oris Code: ${orisCode} ${lookupData.year} ${lookupData.quarter}`,
              id,
            );

            this.logger.info(
              `Missing Oris Code: ${orisCode} ${lookupData.year} ${lookupData.quarter}`,
            );
            continue;
          }

          row.facilityId = orisCode;

          row.download = lookupData.url + name;
          row.quarter = lookupData.quarter;
          row.name = lookupData.fileNamePrefix + name;
          row.year = lookupData.year;

          row.stateCode = result.stateCode;

          zipFiles.push(row);
        }
      }
      return zipFiles;
    } catch (err) {
      this.logError(err.message, id);
      this.logger.info(err.message);
    }
  }

  public async generateSubUrls(
    params: BulkFileCopyParamsDTO,
    url: string,
    objectKeyPrefix: string,
    id: string,
  ) {
    try {
      await this.sftpRepository.update(
        { id: id },
        { statusCd: 'RUNNING', details: 'Generating sub URLS' },
      );

      const { data } = await axios.get(url, {
        /*
        httpsAgent: new Agent({
          rejectUnauthorized: false,
        }),
        */
      });

      // Get initial Edr landing page and parse out all years
      const $ = load(data);
      const listItems = $('tbody tr td a');
      const rows = [];
      listItems.each((idx, el) => {
        const row = new BulkFileCopyDirectoryGenerationDTO();
        row.name = $(el).text();
        row.year = parseInt(row.name.split('/')[0]);

        if (row.name.indexOf('/') > -1) {
          rows.push(row);
        }
      });

      const directoryUrls = [];
      rows.forEach((row) => {
        quarterString.forEach((q) => {
          const parsedInfo = {
            url: '',
            fileNamePrefix: '',
            quarter: q[1],
            year: 0,
          };

          parsedInfo.url = url + row.name + q + '/';
          parsedInfo.fileNamePrefix = objectKeyPrefix + row.name + q + '/';
          parsedInfo.year = row.year;

          if (params.from && params.to) {
            if (row.year >= params.from && row.year <= params.to) {
              directoryUrls.push(parsedInfo);
            }
          } else {
            directoryUrls.push(parsedInfo);
          }
        });
      });

      return directoryUrls;
    } catch (err) {
      this.logError(err.message, id);
      this.logger.info(err.message);
    }
  }
}
