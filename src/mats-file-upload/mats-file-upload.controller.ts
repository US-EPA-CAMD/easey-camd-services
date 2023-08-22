import { Controller, HttpStatus, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MatsFileUploadService } from './mats-file-upload.service';
import { EaseyException } from "@us-epa-camd/easey-common/exceptions";
import { User } from '@us-epa-camd/easey-common/decorators';
import { CurrentUser } from '@us-epa-camd/easey-common/interfaces';

const MAX_UPLOAD_SIZE_MB: number = 30;

@Controller()
@ApiTags("MATs File Upload")
@ApiSecurity('APIKey')
export class MatsFileUploadController {

  constructor(private service: MatsFileUploadService) { }

  @Post(':monPlanId/:testNumber/import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('monPlanId') monPlanId: string,
    @Param('testNumber') testNumber: string,
    @User() user: CurrentUser
  ) {

    const fileErrors = [];
    console.log(file.mimetype)
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024)
      fileErrors.push(`Uploaded file exceeds maximum size of ${MAX_UPLOAD_SIZE_MB}M`);
    if (!['application/pdf', 'application/xml', 'text/xml'].includes(file.mimetype))
      fileErrors.push('Only XML and PDF files may be uploaded');

    if (fileErrors.length > 0)
      throw new EaseyException(
        new Error(fileErrors.join('\n')),
        HttpStatus.BAD_REQUEST,
        { responseObject: fileErrors }
      )
    
    await this.service.uploadFile(file.originalname, file.buffer);
    await this.service.saveImportMetaData(monPlanId, testNumber, file.originalname, user?.userId);
  }
}
