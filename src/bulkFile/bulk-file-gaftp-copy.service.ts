import axios from 'axios';
import { stat, createWriteStream, readFileSync } from 'fs';
import { Agent } from 'https';
import { load } from 'cheerio';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { BulkFileMetadataRepository } from './bulk-file.repository';
import { BulkFileCopyParamsDTO } from 'src/dto/bulk-file-copy.params.dto';
import { BulkFileCopyDirectoryGenerationDTO } from 'src/dto/bulk-file-copy-directory-generation.dto';
import { BulkFileCopyFileGenerationDTO } from 'src/dto/bulk-file-copy-file-generation.dto copy';
import { getManager } from 'typeorm';
import { Plant } from 'src/entities/plant.entity';
import { BulkFileMetadata } from 'src/entities/bulk-file-metadata.entity';
import { S3, S3ClientConfig } from '@aws-sdk/client-s3';

axios.defaults.headers.common = {
  'x-api-key': process.env.EASEY_SFTP_SCRAPER_API_KEY,
};

const quarterString = ['q1', 'q2', 'q3', 'q4'];

@Injectable()
export class BulkFileGAFTPCopyService {
  private s3Client;

  constructor(
    @InjectRepository(BulkFileMetadataRepository)
    private readonly repository: BulkFileMetadataRepository,
    private readonly logger: Logger,
  ) {
    const s: S3ClientConfig = {};
    this.s3Client = new S3({
      region: process.env.EASEY_CAMD_SERVICES_S3_REGION,
    });
  }

  public async uploadFilesToS3(fileInformation, descriptor, dataType, subType) {
    for (const fileData of fileInformation) {
      try {
        console.log('About to stream down');

        const res = await axios.get(fileData.download, {
          httpsAgent: new Agent({
            rejectUnauthorized: false,
          }),
          responseType: 'stream',
        });

        console.log('Attempt stream down');

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
            Description: `${descriptor} submitted by facility ID ${fileData.facilityId} for Part 75 reporting for ${fileData.year} quarter ${fileData.quarter}`,
            DataType: dataType,
            Year: fileData.year,
            s3Path: fileData.name,
          };

          if (fileData.stateCode) meta['StateCode'] = fileData.stateCode;
          if (fileData.quarter) meta['Quarter'] = fileData.quarter;
          if (subType) meta['DataSubType '] = subType;

          const fileParts = fileData.name.split('/');
          const fileName = fileParts[fileParts.length - 1];

          console.log('Stat here');
          stat('src/bulkFile/writeLocation/file.zip', async (error, stats) => {
            if (error) {
              this.logger.error(
                InternalServerErrorException,
                error.message,
                false,
              );
            } else {
              const bulkFileMeta = new BulkFileMetadata();
              bulkFileMeta.fileName = fileName;
              bulkFileMeta.s3Path = fileData.name;
              bulkFileMeta.metadata = JSON.stringify(meta);
              bulkFileMeta.fileSize = stats.size;
              bulkFileMeta.addDate = new Date(Date.now());
              bulkFileMeta.lastUpdateDate = new Date(Date.now());

              console.log(bulkFileMeta);

              console.log('Inside further');

              if (await this.repository.findOne(fileName)) {
                await this.repository.update(fileName, bulkFileMeta);
              } else {
                await this.repository.insert(bulkFileMeta);
              }
            }
          });

          console.log('Putting object');
          await this.s3Client.putObject({
            Bucket: process.env.EASEY_CAMD_SERVICES_S3_BUCKET,
            Key: fileData.name,
            Body: readFileSync('src/bulkFile/writeLocation/file.zip'),
          });
        }
      } catch (err) {
        this.logger.error(InternalServerErrorException, err.message, true);
      }
    }
  }

  public async generateFileData(lookupData) {
    const entityManager = getManager();

    try {
      // Get initial Edr landing page and parse out all years

      const { data } = await axios.get(lookupData.url, {
        httpsAgent: new Agent({
          rejectUnauthorized: false,
        }),
      });

      console.log('Ran here');

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

          console.log('Further here');

          if (!result) {
            this.logger.error(
              InternalServerErrorException,
              `Missing Oris Code: ${orisCode} ${lookupData.year} ${lookupData.quarter}`,
              false,
            );
            continue;
          }

          row.facilityId = result.id;

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
      this.logger.error(InternalServerErrorException, err.message, false);
    }
  }

  public async generateSubUrls(
    params: BulkFileCopyParamsDTO,
    url: string,
    objectKeyPrefix: string,
  ) {
    try {
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
      this.logger.error(InternalServerErrorException, err.message, false);
    }
  }
}
