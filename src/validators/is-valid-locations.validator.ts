import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { MonitorLocation } from '../entities/monitor-location.entity';

@Injectable()
@ValidatorConstraint({ name: 'isValidLocations', async: true })
export class IsValidLocationsValidator implements ValidatorConstraintInterface {
  constructor(private readonly entityManager: EntityManager) {}

  async validate(value: string | string[], args: ValidationArguments) {
    if (value) {
      if (typeof value === 'string') {
        if (value.includes(',')) {
          value = value.split(',');
        } else if (value.includes('|')) {
          value = value.split('|');
        } else {
          value = [value];
        }
      }
      value = value.filter((v) => v !== '');

      const facId = args.object['facilityId'];
      const found = await this.entityManager
        .getRepository(MonitorLocation)
        .createQueryBuilder('ml')
        .leftJoin('ml.unit', 'u')
        .leftJoin('u.plant', 'u_p')
        .leftJoin('ml.stackPipe', 'sp')
        .leftJoin('sp.plant', 'sp_p')
        .where('(u.name IN (:...value) AND u_p.facIdentifier = :facId)', {
          facId,
          value,
        })
        .orWhere('(sp.name IN (:...value) AND sp_p.facIdentifier = :facId)', {
          facId,
          value,
        })
        .getMany();

      return found.length === value.length;
    }
    return true;
  }
}
