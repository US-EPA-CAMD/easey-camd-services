import { ReportDetailDTO } from './../dto/report-detail.dto';
import { Injectable, StreamableFile } from '@nestjs/common';
import { Logger } from '@us-epa-camd/easey-common/logger';
import { EntityManager } from 'typeorm';
import { ReportDTO } from '../dto/report.dto';
import { ReportColumnDTO } from '../dto/report-column.dto';
import { DataSetService } from '../dataset/dataset.service';
import { submissionFeedbackTemplate } from './submission-feedback-template';
import { KeyValuePairs, SubmissionEmailParamsDto } from '../dto/submission-email-params.dto';

@Injectable()
export class SubmissionFeedbackRecordService {
  constructor(
    private readonly logger: Logger,
    private dataService: DataSetService,
    private readonly entityManager: EntityManager,
  ) {}

  createSubmissionFeedbackEmailAttachment(submissionEmailParamsDto : SubmissionEmailParamsDto): string {
    let documentContent = submissionFeedbackTemplate;
    documentContent = this.replaceAttachmentHeaderContents(documentContent, submissionEmailParamsDto);
    return documentContent;
  }

  replaceAttachmentHeaderContents(content: string, submissionEmailParamsDto : SubmissionEmailParamsDto): string {

    content = content.replace(/{{FACILITY_NAME}}/g, submissionEmailParamsDto.templateContext['monitorPlan'].item.facilityName);
    content = content.replace(/{{FACILITY_ID}}/g, submissionEmailParamsDto.templateContext['monitorPlan'].item.orisCode);
    content = content.replace(/{{UNIT_STACK_PIPE_ID}}/g, submissionEmailParamsDto.templateContext['monitorPlan'].item.unitStackPipe);
    content = content.replace(/{{SUBMISSION_DATE}}/g, submissionEmailParamsDto.templateContext['monitorPlan'].item.submissionDateDisplay);
    content = content.replace(/{{STATE}}/g, submissionEmailParamsDto.templateContext['monitorPlan'].item.stateCode);

    return content;
  }

  generateSummaryTableForUnitStack(data: ReportDTO, locationId: string): string {
    let summaryTableContent = '';

    // Process each detail from the report
    for (const detail of data.details) {
      const columns = data.columns.find((x) => x.code === detail.templateCode);
      summaryTableContent += this.addDefaultTable(columns, detail, locationId);
    }

    return summaryTableContent;
  }

  addDefaultTable(columns: ReportColumnDTO, detail: ReportDetailDTO, locationId: string): string {
    let innerContent = this.addTableHeader(locationId);
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

  addTableHeader(locationId: string): string {
    return `<b> Unit/Stack/Pipe ID: ${locationId} </b>`;
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

}
