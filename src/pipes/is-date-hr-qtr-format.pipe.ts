import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsDateHrQtrFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsDateHrQtrFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value) {
            if (value.includes('Q')) {
              return String(value).match(/^\d{4} Q\d$/) != null;
            }
            if (value.includes(' ')) {
              return String(value).match(/^\d{4}-\d{2}-\d{2} \d{2}$/) != null;
            }
            return String(value).match(/^\d{4}-\d{2}-\d{2}$/) != null;
          }
          return true;
        },
      },
    });
  };
}
