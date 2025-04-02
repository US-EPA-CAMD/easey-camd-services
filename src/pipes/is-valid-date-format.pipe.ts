import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments
} from "class-validator";

export function IsValidDateFormat(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: "IsValidDateFormat",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        return false
                    }
                    return true;
                },
            },
        });
    };
}
