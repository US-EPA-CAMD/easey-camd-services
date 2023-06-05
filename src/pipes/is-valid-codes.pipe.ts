import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

import { FindManyOptions, getManager } from 'typeorm';

export function IsValidCodes(
  type: any,
  findOption: (ValidationArguments: ValidationArguments) => FindManyOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCodes',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          if (value) {
            const manager = getManager();

            const found = await manager.find(type, findOption(args));

            if (typeof args.value === 'string') {
              args.value = args.value.split(',').map((item) => item.trim());
            }
            if (args.value.length !== found.length) {
              return false;
            }
          }
          return true;
        },
      },
    });
  };
}
