import Joi from 'joi';
import { ValidationError } from '../../utils/errors';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import logger from '../../utils/logger';

export default class JoiService implements IValidatorService {
  public validateRequiredFields(input: Record<string, unknown>): void {
    const schema = Joi.object().keys(
      Object.keys(input).reduce((acc: Record<string, Joi.Schema>, key) => {
        acc[key] = Joi.required();
        return acc;
      }, {})
    );

    const { error } = schema.validate(input);
    if (error) {
      throw new ValidationError(`Missing required fields: ${error.details.map((detail) => detail.message).join(', ')}`);
    }
  }

  public validateEmailFormat(email: string): boolean {
    const schema = Joi.string().email({ tlds: { allow: false } });
    const { error } = schema.validate(email);
    if (error) {
      throw new ValidationError('Invalid email format');
    }
    return true;
  }

  public validateLength(field: string, minLength: number, maxLength: number = Infinity): boolean {
    const schema = Joi.string().min(minLength).max(maxLength);
    const { error } = schema.validate(field);
    if (error) {
      throw new ValidationError(`Invalid length for field, expected between ${minLength} and ${maxLength} characters`);
    }
    return true;
  }

  public validateIdFormat(id: string): boolean {
    const schema = Joi.string().pattern(new RegExp('^[a-fA-F0-9]{24}$'));
    const { error } = schema.validate(id);
    logger.info('id:::', id);
    if (error) {
      throw new ValidationError('Invalid ID format (must be a valid MongoDB ObjectId)');
    }
    return true;
  }

  public validateMultipleIds(ids: string[]): boolean {
    const schema = Joi.array().items(Joi.string().pattern(new RegExp('^[a-fA-F0-9]{24}$')));
    const { error } = schema.validate(ids);
    if (error) {
      throw new ValidationError('Invalid ID format in array (must be valid MongoDB ObjectIds)');
    }
    return true;
  }

  public validatePhoneNumber(phoneNumber: string): boolean {
    // Assuming Indian phone numbers: 10 digits, optional +91
    const schema = Joi.string().pattern(/^\+?91[6-9]\d{9}$|^[6-9]\d{9}$/);
    const { error } = schema.validate(phoneNumber);
    if (error) {
      throw new ValidationError('Invalid phone number format (must be a valid 10-digit Indian number)');
    }
    return true;
  }

  public validateDateFormat(date: string): boolean {
    const schema = Joi.date().iso();
    const { error } = schema.validate(date);
    if (error) {
      throw new ValidationError('Invalid date format (must be ISO string)');
    }
    return true;
  }

  public validateTimeFormat(time: string): boolean {
    // Assuming 24-hour format HH:MM as used in appointment slots (e.g., "09:00")
    const schema = Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
    const { error } = schema.validate(time);
    if (error) {
      throw new ValidationError('Invalid time format, must be in "HH:MM" (24-hour) format');
    }
    return true;
  }

  public validateEnum(field: string, enumValues: string[]): boolean {
    const schema = Joi.string().valid(...enumValues);
    const { error } = schema.validate(field);
    if (error) {
      throw new ValidationError(`Invalid value for field, expected one of: ${enumValues.join(', ')}`);
    }
    return true;
  }

  public validatePassword(password: string): boolean {
    const schema = Joi.string()
      .min(8)
      .max(70)
      .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
    const { error } = schema.validate(password);
    if (error) {
      throw new ValidationError(
        'Password must be at least 8 characters, include at least one uppercase letter, one number, and one special character'
      );
    }
    return true;
  }

  public validateBoolean(value: unknown): boolean {
    const schema = Joi.boolean();
    const { error } = schema.validate(value);
    if (error) {
      throw new ValidationError('Invalid boolean value');
    }
    return true;
  }

  public validateRating(rating: number): boolean {
    const schema = Joi.number().min(1).max(5).integer();
    const { error } = schema.validate(rating);
    if (error) {
      throw new ValidationError('Rating must be an integer between 1 and 5');
    }
    return true;
  }

  public validatePositiveNumber(num: number, minValue: number = 0): boolean {
    const schema = Joi.number().min(minValue).positive();
    const { error } = schema.validate(num);
    if (error) {
      throw new ValidationError(`Invalid number: must be positive and greater than or equal to ${minValue}`);
    }
    return true;
  }

  public validatePositiveInteger(num: number, minValue: number = 1): boolean {
    const schema = Joi.number().min(minValue).integer().positive();
    const { error } = schema.validate(num);
    if (error) {
      throw new ValidationError(`Invalid integer: must be a positive integer greater than or equal to ${minValue}`);
    }
    return true;
  }

  public validateName(name: string): boolean {
    const schema = Joi.string()
      .min(2)
      .max(100)
      .trim()
      .regex(/^[a-zA-Z\s]+$/);
    const { error } = schema.validate(name);
    if (error) {
      throw new ValidationError('Invalid name: must be 2-100 characters, letters and spaces only');
    }
    return true;
  }

  public validateLicenseNumber(license: string): boolean {
    // Assuming a simple alphanumeric pattern for license numbers (customize as needed)
    const schema = Joi.string().min(5).max(50).alphanum();
    const { error } = schema.validate(license);
    if (error) {
      throw new ValidationError('Invalid license number: must be 5-50 alphanumeric characters');
    }
    return true;
  }

  public validateTimeSlot(startTime: string, endTime: string): boolean {
    this.validateTimeFormat(startTime);
    this.validateTimeFormat(endTime);

    // Additional logic: ensure startTime < endTime (basic check, assuming same day)
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];

    if (startMinutes >= endMinutes) {
      throw new ValidationError('Start time must be before end time');
    }

    // Slot duration check (e.g., min 15 min, max 120 min - customizable)
    const duration = endMinutes - startMinutes;
    if (duration < 15 || duration > 120) {
      throw new ValidationError('Time slot duration must be between 15 and 120 minutes');
    }

    return true;
  }

  public validateOtp(otp: string): boolean {
    const schema = Joi.string()
      .length(6)
      .pattern(/^\d{6}$/);
    const { error } = schema.validate(otp);
    if (error) {
      throw new ValidationError('Invalid OTP: must be a 6-digit number');
    }
    return true;
  }
}
