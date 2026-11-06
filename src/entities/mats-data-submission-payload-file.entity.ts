import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { MatsDataFileTypeCode } from './mats-data-file-type-code.entity';

@Entity({ name: 'camdecmpsaux.mats_data_submission_payload_file' })
export class MatsDataSubmissionPayloadFile extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'mats_data_sub_payload_file_id' })
  matsDataSubPayloadFileId: number;

  @Column({ name: 'mats_data_sub_id' })
  matsDataSubId: number;

  @ManyToOne(() => MatsDataFileTypeCode)
  @JoinColumn({ name: 'mats_data_file_type_cd' })
  matsDataFileType: MatsDataFileTypeCode;

   // this for direct access if needed
   @Column({ name: 'mats_data_file_type_cd' })
   matsDataFileTypeCd: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'temp_s3_bucket_file_path' })
  tempS3BucketFilePath: string;

  @Column({ name: 'temp_s3_bucket_file_time', type: 'timestamp' })
  tempS3BucketFileTime: Date;

  @Column({ name: 'main_s3_bucket_file_path', nullable: true })
  mainS3BucketFilePath: string;

  @Column({ name: 'main_s3_bucket_file_time', type: 'timestamp', nullable: true })
  mainS3BucketFileTime: Date;
}