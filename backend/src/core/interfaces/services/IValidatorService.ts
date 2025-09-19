export interface IValidatorService {
  validateRequiredFields(input: object): void;
  validateEmailFormat(email: string): boolean;
  validateLength(field: string, minLength: number, maxLength?: number): boolean;
  validateIdFormat(id: string): boolean;
  validatePhoneNumber(phoneNumber: string): boolean;
  validateDateFormat(date: string): boolean;
  validateTimeFormat(time: string): boolean;
  validateEnum(field: string, enumValues: string[]): boolean;
  validatePassword(password: string): boolean;
  validateBoolean(value: unknown): boolean;
  validateMultipleIds(ids: string[]): boolean;
  validateRating(rating: number): boolean;
  validatePositiveNumber(num: number, minValue?: number): boolean;
  validatePositiveInteger(num: number, minValue?: number): boolean;
  validateName(name: string): boolean;
  validateLicenseNumber(license: string): boolean;
  validateTimeSlot(startTime: string, endTime: string): boolean;
  validateOtp(otp: string): boolean;
}
