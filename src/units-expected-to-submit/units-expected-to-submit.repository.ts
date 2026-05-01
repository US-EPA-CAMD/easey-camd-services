import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { UnitsExpectedView } from '../entities/units-expected-view.entity';
import { UnitsExpectedParamsDTO } from '../dto/units-expected-params.dto';

@Injectable()
export class UnitsExpectedRepository extends Repository<UnitsExpectedView> {
  constructor(entityManager: EntityManager) {
    super(UnitsExpectedView, entityManager);
  }

  async getUnitsExpectedToSubmit(
    params: UnitsExpectedParamsDTO,
  ): Promise<UnitsExpectedView[]> {
    const {
      facilityId,
      facilityName,
      stateCode,
      programCode,
      year,
      quarter,
      windowStatus,
    } = params;

    const result = await this.query(
      `SELECT * FROM camdecmpsaux.get_units_expected_to_submit_report_data(
        $1, $2, $3, $4, $5, $6, $7
      )`,
      [
        facilityId || null,
        facilityName || null,
        stateCode || null,
        programCode,
        year,
        quarter,
        windowStatus || null,
      ],
    );

    return Promise.all(
      result.map(async (row) => {
        const entity = new UnitsExpectedView();

        entity.facilityId = Number(row.oris_code);
        entity.facilityName = row.facility_name;
        entity.stateCode = row.state;
        entity.unitId = row.unitid;
        entity.locations = row.locations;
        entity.submissionTypeDescription = row.em_sub_type_cd_description;
        entity.accessBeginDate = row.access_begin_date;
        entity.accessEndDate = row.access_end_date;
        entity.windowStatus = row.window_status;
        entity.submissionStatus = row.submission_status;
        entity.submissionId = row.submission_id;
        entity.submissionDate = row.submission_date;
        entity.severityDescription = row.severity_cd_description;

        const subRecords = await this.query(
          `SELECT * FROM camdecmpsaux.get_unit_program_subrecords($1, $2, $3)`,
          [
            facilityId,
            entity.unitId,
            programCode 
          ]
        );

        entity.subRecords = subRecords || [];

        return entity;
      })
    );
  }
}