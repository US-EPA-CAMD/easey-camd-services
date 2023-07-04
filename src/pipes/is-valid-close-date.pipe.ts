import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

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
            const closeDate = new Date(value);
            const openDate = new Date(args.object['openDate']);
            return closeDate < openDate;
          }
          return true;
        },
      },
    });
  };
}
