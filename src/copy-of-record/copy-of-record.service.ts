import { Injectable, StreamableFile } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { copyOfRecordTemplate } from './template';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { ReportParamsDTO } from '../dto/report-params.dto';
import { DataSetService } from '../dataset/dataset.service';
import { data } from 'cheerio/lib/api/attributes';
import { createReadStream, writeFileSync, rmSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Response } from 'express';
import { Plant } from '../entities/plant.entity';

@Injectable()
export class CopyOfRecordService {
  constructor(
    private readonly logger: Logger,
    private dataService: DataSetService,
  ) {}

  addDocumentHeader(content: string, title: string): string {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };

    content = content.replace(
      '{DATE}',
      date.toLocaleDateString('en-US', options),
    );

    return content.replace('{HEADER}', title);
  }

  addTableHeader(title: string): string {
    const heading = `<h2> ${title} </h2>`;
    return heading;
  }

  addColTable(
    columns: ReportColumnDTO,
    results,
    displayName,
    columnCount: number,
  ): string {
    let innerContent = this.addTableHeader(displayName);
    innerContent += '<div class = "col-table-container">';

    const itemsPerColumn = Math.ceil(columns.values.length / columnCount);

    let idx = 0;
    for (let i = 0; i < columnCount; i++) {
      innerContent += '<table class = "col-table">';
      for (let j = 0; j < itemsPerColumn; j++) {
        if (idx < columns.values.length) {
          innerContent += '<tr>';

          innerContent += `<th> ${columns.values[idx].displayName} </th>`;
          innerContent += `<td> ${results[0][columns.values[idx].name]} </td>`;

          innerContent += '</tr>';
        }
        idx++;
      }
      innerContent += '</table>';
    }

    innerContent += '</div>';

    return innerContent;
  }

  addDefaultTable(
    columns: ReportColumnDTO,
    results,
    displayName,
    isPdf,
  ): string {
    let innerContent = this.addTableHeader(displayName);

    innerContent += '<div> <table>';

    //Load column headings
    innerContent += '<tr>';
    for (const column of columns.values) {
      innerContent += `<th> ${column.displayName} </th>`;
    }
    innerContent += '</tr>';

    const codeToDefinitions = new Map<string, string[]>(); //Prepopulate our table of code descriptions used for the table legend

    //Load column rows
    for (const result of results) {
      innerContent += '<tr>';
      for (const column of columns.values) {
        //Populate the code definitions for the legend of this table
        if (
          result[column.name + 'Group'] &&
          result[column.name + 'Description']
        ) {
          if (codeToDefinitions.has(result[column.name + 'Group'])) {
            const arr = codeToDefinitions.get(result[column.name + 'Group']);
            arr.push(
              `${result[column.name]} - ${result[column.name + 'Description']}`,
            );

            codeToDefinitions.set(result[column.name + 'Group'], arr);
          } else {
            const arr = [];
            arr.push(
              `${result[column.name]} - ${result[column.name + 'Description']}`,
            );

            codeToDefinitions.set(result[column.name + 'Group'], arr);
          }
        }

        if (result[column.name]) {
          innerContent += `<td> ${result[column.name]} </td>`;
        } else {
          innerContent += `<td></td>`;
        }
      }
      innerContent += '</tr>';
    }

    innerContent += '</table> </div>';

    //Populate legend from map
    codeToDefinitions.forEach((vals, key) => {
      if (vals.length > 0) {
        const minifiedVals = new Set(vals);
        innerContent +=
          '<div class ="code-section"> <div class = "col-table-container">';

        innerContent += `<div class = "code-group"> ${key}: </div>`;
        innerContent += `<div class = "code-values">`;

        for (const codeVal of Array.from(minifiedVals)) {
          innerContent += `<div> ${codeVal} </div>`;
        }

        innerContent += '</div> </div> </div>';
      }
    });

    return innerContent;
  }

  generateCopyOfRecord(data: ReportDTO, isPdf: boolean = false): string {
    let documentContent = copyOfRecordTemplate;
    documentContent = this.addDocumentHeader(documentContent, data.displayName);
    let innerContent = '';

    // Process each detail from the report
    for (const detail of data.details) {
      const columns = data.columns.find((x) => x.code === detail.templateCode);
      const templateType = detail.templateType;
      const results = detail.results;

      if (templateType.includes('COLTBL')) {
        let modifiedDisplayName = detail.displayName;

        if (results[0]['unitStack']) {
          modifiedDisplayName = `Unit/Stack/Pipe ID: ${results[0]['unitStack']} - ${modifiedDisplayName}`;
        }

        //Special formatting for smaller column sizes
        innerContent += this.addColTable(
          columns,
          results,
          modifiedDisplayName,
          parseInt(templateType.charAt(0)),
        );
      } else {
        //Default table view
        innerContent += this.addDefaultTable(
          columns,
          results,
          detail.displayName,
          isPdf,
        );
      }
    }

    documentContent = documentContent.replace('{CONTENT}', innerContent);

    return documentContent;
  }

  async getCopyOfRecordPDF(
    params: ReportParamsDTO,
    res: Response,
    isWorkspace: boolean,
  ): Promise<StreamableFile> {
    const reportInformation = await this.dataService.getDataSet(
      params,
      isWorkspace,
    );

    const htmlContent = this.generateCopyOfRecord(reportInformation, true);

    const plant: Plant = await Plant.findOne(params.facilityId);

    let responseFileName;
    if (params.reportCode === 'EM') {
      responseFileName = `${params.reportCode}_${plant.facilityName}_${plant.orisCode}_${params.year}Q${params.quarter}.html`;
    } else {
      responseFileName = `${params.reportCode}_${plant.facilityName}_${plant.orisCode}.html`;
    }

    res.set({
      'Content-Type': 'application/html',
      'Content-Disposition': `attachment; filename="${responseFileName}"`,
    });

    const fileName = uuidv4();

    writeFileSync(`${__dirname}/${fileName}.html`, htmlContent);

    const stream = createReadStream(`${__dirname}/${fileName}.html`);
    stream.on('end', () => {
      rmSync(`${__dirname}/${fileName}.html`);
    });

    return new StreamableFile(stream);
  }
}
