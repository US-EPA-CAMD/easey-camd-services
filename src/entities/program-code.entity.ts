import { BaseEntity, Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'camdmd.program_code' })
export class ProgramCode extends BaseEntity {
  @PrimaryColumn({ name: 'prg_cd' })
  prgCode: string;

  @Column({ name: 'bulk_file_active' })
  active: number;
}
