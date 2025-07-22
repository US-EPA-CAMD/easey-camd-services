import { ApiProperty } from '@nestjs/swagger';

export class EmailRecipientDto {
  @ApiProperty({
    description: 'Email address list',
    example: 'Trey Lightsey <CAMD_BP_3.1_CBS_Rearch_Mail_Test@easternresearchgroup.onmicrosoft.com>',
  })
  emailAddressList: string;

  @ApiProperty({
    description: 'List of plant IDs associated with this email',
    example: [5, 3, 1],
    isArray: true,
    type: Number,
  })
  plantIdList: number[];
}

export class EmailRecipientListResponseDto {
  @ApiProperty({
    description: 'List of email recipients',
    type: [EmailRecipientDto],
    isArray: true,
  })
  recipients: EmailRecipientDto[];

  @ApiProperty({
    description: 'Indicates if an error occurred',
    example: false,
  })
  hasError: boolean;

  @ApiProperty({
    description: 'Error message if an error occurred',
    example: '',
  })
  errorMessage: string;
}