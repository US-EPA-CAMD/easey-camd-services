import axios from 'axios';
import { v4 } from 'uuid';
import { Agent } from 'https';
import { load } from 'cheerio';
import { getManager } from 'typeorm';
import { stat, createWriteStream, readFileSync, unlink } from 'fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from '@aws-sdk/client-s3';
import { Logger } from '@us-epa-camd/easey-common/logger';

import { Plant } from '../entities/plant.entity';
import { MissingOris } from '../entities/missing-oris.entity';
import { SftpFailure } from '../entities/sftp-failures.entity';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileCopyParamsDTO } from '../dto/bulk-file-copy.params.dto';
import { BulkFileCopyDirectoryGenerationDTO } from '../dto/bulk-file-copy-directory-generation.dto';
import { BulkFileCopyFileGenerationDTO } from '../dto/bulk-file-copy-file-generation.dto';
import { BulkFileMetadata } from '../entities/bulk-file-metadata.entity';
import { BulkFileGaftpCopyRepository } from './bulk-file-gaftp-copy.repository';

axios.defaults.headers.common = {
  'x-api-key': process.env.EASEY_CAMD_SERVICES_API_KEY,
};

const quarterString = ['q1', 'q2', 'q3', 'q4'];

@Injectable()
export class BulkFileGAFTPCopyService {
  private s3Client;
  private entityManager;

  constructor(
    @InjectRepository(BulkFileMetadataRepository)
    private readonly repository: BulkFileMetadataRepository,
    @InjectRepository(BulkFileGaftpCopyRepository)
    private readonly sftpRepository: BulkFileGaftpCopyRepository,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.s3Client = new S3(this.configService.get('s3Config'));
    this.entityManager = getManager();
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

  private async logMissingOris(oris: number) {
    await this.entityManager.insert(MissingOris, { id: v4(), orisCode: oris });
  }

  public async uploadFilesToS3(
    fileInformation,
    dataType,
    subType,
    id,
    tries = 1,
  ) {
    await this.sftpRepository.update(
      { id: id },
      {
        details: `Uploading Files ${dataType}-${subType}`,
      },
    );

    const promises = [];

    const filesToRetry = [];

    for (const fileData of fileInformation) {
      await new Promise((f) => setTimeout(f, 50));
      promises.push(
        new Promise(async (resolve) => {
          try {
            const fileNameUid = v4();

            const res = await axios.get(fileData.download, {
              httpsAgent: new Agent({
                rejectUnauthorized: false,
              }),

              responseType: 'stream',
            }); //

            if (res.status == 200) {
              res.data.pipe(
                createWriteStream(
                  `src/bulkFile/writeLocation/${fileNameUid}.zip`,
                ),
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

              stat(
                `src/bulkFile/writeLocation/${fileNameUid}.zip`,
                async (error, stats) => {
                  if (error) {
                    this.logger.info(error.message);
                  } else {
                    const bulkFileMeta = new BulkFileMetadata();
                    bulkFileMeta.filename = fileName;
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
                },
              );

              await this.s3Client.putObject({
                Bucket: this.configService.get('s3Config.bucket'),
                Key: fileData.name,
                Body: readFileSync(
                  `src/bulkFile/writeLocation/${fileNameUid}.zip`,
                ),
              });

              unlink(`src/bulkFile/writeLocation/${fileNameUid}.zip`, () => {
                this.logError('File Not Deleted: ' + fileNameUid, id);
              });
            }
            resolve(true);
          } catch (err) {
            filesToRetry.push(fileData);
            this.logger.info(err.message);
            resolve(false);
          }
        }),
      );
    }

    await Promise.all(promises);

    if (filesToRetry.length > 0 && tries < 10) {
      //Recursively load the files that did not complete
      console.log(
        filesToRetry.length +
          ' Files did not get processed properly, retrying them',
      );
      await new Promise((f) => setTimeout(f, 1000));
      await this.uploadFilesToS3(filesToRetry, dataType, subType, id, tries++);
    } else if (filesToRetry.length > 0) {
      for (const fileEntry of filesToRetry) {
        const sftpFailure = new SftpFailure();
        sftpFailure.id = v4();
        sftpFailure.fileDescription = `${dataType}-${subType} : ${fileEntry.name}`;
        await this.entityManager.insert(SftpFailure, sftpFailure);
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
        httpsAgent: new Agent({
          rejectUnauthorized: false,
        }),
      });

      const $ = load(data);
      const listItems = $('tbody tr td a');

      const zipFiles = [];
      const promises = [];
      for (const el of listItems) {
        promises.push(
          new Promise(async (resolve) => {
            const row = new BulkFileCopyFileGenerationDTO();
            const name = $(el).text();

            const orisCode = parseInt(name.split('_')[0]);

            if (!isNaN(orisCode)) {
              const result = await entityManager.findOne(Plant, {
                orisCode: orisCode,
              });

              row.facilityId = orisCode;

              row.download = lookupData.url + name;
              row.quarter = lookupData.quarter;
              row.name = lookupData.fileNamePrefix + name;
              row.year = lookupData.year;

              if (!result) {
                await this.logMissingOris(orisCode);
                await this.logError(
                  `Missing Oris Code: ${orisCode} ${lookupData.year} ${lookupData.quarter}`,
                  id,
                );
                row.stateCode = 'Missing';
              } else {
                row.stateCode = result.stateCode;
              }

              zipFiles.push(row);
            }

            resolve(true);
          }),
        );
      }

      await Promise.all(promises);

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
        httpsAgent: new Agent({
          rejectUnauthorized: false,
        }),
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
