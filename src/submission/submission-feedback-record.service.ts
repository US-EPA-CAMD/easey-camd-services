import { ReportDetailDTO } from './../dto/report-detail.dto';
import { Injectable } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { DataSetService } from '../dataset/dataset.service';
import { KeyValuePairs } from '../dto/submission-email-params.dto';

@Injectable()
export class SubmissionFeedbackRecordService {
  constructor(
    private readonly logger: Logger,
    private dataService: DataSetService,
    private readonly entityManager: EntityManager,
  ) {}

  generateSummaryTableForUnitStack(data: ReportDTO, locationId: string): string {
    let summaryTableContent = '';

    // Process each detail from the report
    for (const detail of data.details) {
      const columns = data.columns.find((x) => x.code === detail.templateCode);
      let header = `<b> Unit/Stack/Pipe ID: ${locationId} </b>`;
      summaryTableContent += this.addTable(columns, detail, header);
    }

    return summaryTableContent;
  }

  addTable(columns: ReportColumnDTO, detail: ReportDetailDTO, header: string): string {
    let innerContent = header;
    innerContent += '<div> <table class = "default">';

    //Load column headings
    innerContent += '<tr>';
    for (const column of columns?.values ?? []) {
      innerContent += `<th> ${column.displayName} </th>`;
    }
    innerContent += '</tr>';

    //Load column rows
    for (const result of detail?.results ?? []) {
      innerContent += '<tr>';
      for (const column of columns.values) {
        if (result[column.name]) {
          innerContent += `<td> ${result[column.name]} </td>`;
        } else {
          innerContent += `<td></td>`;
        }
      }
      innerContent += '</tr>';
    }

    innerContent += '</table> </div>';

    return innerContent;
  }

  getSubmissionReceiptTableContent(pairs: KeyValuePairs): string {
    let innerContent = '<div> <table class = "col-table">';

    for (const [key, value] of Object.entries(pairs)) {
      innerContent += '<tr>';
      innerContent += `<td>${key}</td>`;
      if (typeof value === 'string') {
        innerContent += `<td>${value}</td>`;
      } else if (typeof value === 'object' && 'label' in value && 'url' in value) {
        innerContent += `<td><a href="${value.url}">${value.label}</a></td>`;
      }
      innerContent += '</tr>';
    }

    innerContent += '</table> </div>';

    return innerContent;
  }

  generateQATable(data: ReportDTO): string {
    let qaTableContent = '';

    // There should only be one detail here.
    for (const detail of data.details) {
      const columns = data.columns.find((x) => x.code === detail.templateCode);
      let header = `<b> ${data.displayName} </b>`;
      qaTableContent += this.addTable(columns, detail, header);
    }

    return qaTableContent;
  }

  addQATable(data: ReportDTO, columns: ReportColumnDTO, detail: ReportDetailDTO): string {

    let innerContent = `<b> ${data.displayName} </b>`;
    innerContent += '<div> <table class="default">';

    // Load column headings
    innerContent += '<tr>';
    const displayedColumns = columns?.values?.filter(column => column.name !== 'error_msg') ?? [];
    if (displayedColumns.length) {
      for (const column of displayedColumns) {
        innerContent += `<th> ${column.displayName || ''} </th>`;
      }
    }
    innerContent += '</tr>';

    // Initialize variables to track previous row values for merging
    let prevUnitStackPipe: string | null | undefined = null;
    let prevTestType: string | null | undefined = null;

    // Load column rows with row spanning logic
    if (detail?.results?.length) {
      for (const result of detail.results) {
        // Check if error_msg is non-null or non-empty
        if (result.error_msg) {
          innerContent += `
              <tr>
                  <td colspan="${displayedColumns.length}">
                      An error has occurred during processing. Please contact support for assistance.
                  </td>
              </tr>
              `;
          break; // No need to process further rows if there's an error
        }

        innerContent += '<tr>';

        // Handle Unit/Stack/Pipe column with row spanning
        const currentUnitStackPipe = result[displayedColumns[0]?.name];
        if (currentUnitStackPipe !== prevUnitStackPipe) {
          prevUnitStackPipe = currentUnitStackPipe;
          innerContent += `<td rowspan="${this.calculateRowSpan(detail.results, displayedColumns[0]?.name, currentUnitStackPipe)}"> ${currentUnitStackPipe || ''} </td>`;
        }

        // Handle Test Type column with row spanning
        const currentTestType = result[displayedColumns[1]?.name];
        if (currentTestType !== prevTestType) {
          prevTestType = currentTestType;
          innerContent += `<td rowspan="${this.calculateRowSpan(detail.results, displayedColumns[1]?.name, currentTestType)}"> ${currentTestType || ''} </td>`;
        }

        // Populate the remaining columns normally, excluding error_msg
        for (let i = 2; i < displayedColumns.length; i++) {
          const column = displayedColumns[i];
          if (result[column.name]) {
            innerContent += `<td> ${result[column.name] || ''} </td>`;
          } else {
            innerContent += `<td></td>`;
          }
        }

        innerContent += '</tr>';
      }
    }

    innerContent += '</table> </div>';

    return innerContent;
  }

  calculateRowSpan(results: any[], columnName: string | undefined, value: string | null | undefined): number {
    if (!columnName || !value) {
      return 0;
    }
    return results.filter(r => r[columnName] === value).length;
  }

}
