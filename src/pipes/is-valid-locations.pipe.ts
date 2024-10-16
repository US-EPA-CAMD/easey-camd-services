import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsValidLocationsValidator } from '../validators/is-valid-locations.validator';

export function IsValidLocations(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidLocations',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidLocationsValidator,
    });
  };
}
