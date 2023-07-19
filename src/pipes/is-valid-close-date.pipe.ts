import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const moment = require('moment');

export function IsValidCloseDate() {
  return function (object: Object, propertyName: string) {
    let validationOptions: ValidationOptions = {
      message: () => {
        return `${propertyName} can not be a date before the entered openDate`;
      },
    };

    registerDecorator({
      name: 'IsValidCloseDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value && args.object['openDate']) {
            const closeDate = moment(value);
            const openDate = moment(args.object['openDate']);
            return closeDate.isSameOrAfter(openDate);
          }
          return true;
        },
      },
    });
  };
}
