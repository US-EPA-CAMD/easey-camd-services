import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MatsProcessParamsDTO {
    @ApiProperty()
    @IsNumber()
    matsDataSubmissionId: number;

    @ApiProperty()
    @IsString()
    userId: string

    @ApiProperty()
    @IsString()
    firstName: string

    @ApiProperty()
    @IsString()
    lastName: string

    @ApiProperty()
    @IsString()
    middleInitial: string

    @ApiProperty()
    @IsString()
    activityDescription: string

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    htmlMetadataReport?: string;
}
