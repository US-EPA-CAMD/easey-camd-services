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
            const v = String(value);
            if (v.includes('Q')) {
              const q = Number(v.slice(-1));
              if (q >= 1 && q <= 4) {
                return v.match(/^\d{4} Q\d$/) != null;
              } else {
                return false;
              }
            }
            if (v.includes(' ')) {
              return v.match(/^\d{4}-\d{2}-\d{2} \d{2}$/) != null;
            }
            return v.match(/^\d{4}-\d{2}-\d{2}$/) != null;
          }
          return true;
        },
      },
    });
  };
}
