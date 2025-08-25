export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  loginPassword: /^.{6,}$/,
  phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{3,6}$/,
  name: /^[a-zA-Z\u00C0-\u017F\s'-]{2,50}$/,
  licenseNumber: /^[A-Za-z0-9-]{6,20}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  numeric: /^[0-9]+$/,
  medicationName: /^[a-zA-Z0-9\s-]{2,50}$/,
  dosage: /^[a-zA-Z0-9\s-]{2,20}$/,
  frequency: /^[a-zA-Z0-9\s-]{2,50}$/,
  duration: /^[a-zA-Z0-9\s-]{2,20}$/,
};

export const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Email is required';
  if (!ValidationPatterns.email.test(email))
    return 'Please enter a valid email address';
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!ValidationPatterns.password.test(password)) {
    return 'Password must contain uppercase, lowercase, number, and special character';
  }
  return undefined;
};

export const validateLoginPassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return undefined;
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone) return 'Phone number is required';
  if (!ValidationPatterns.phone.test(phone))
    return 'Please enter a valid phone number';
  return undefined;
};

export const validateName = (name: string): string | undefined => {
  if (!name) return 'Name is required';
  if (!ValidationPatterns.name.test(name))
    return 'Name must be 2-50 valid characters';
  return undefined;
};

export const validateLicenseNumber = (license: string): string | undefined => {
  if (!license) return 'License number is required';
  if (!ValidationPatterns.licenseNumber.test(license)) {
    return 'License number must be 6-20 alphanumeric characters';
  }
  return undefined;
};

export const validateDate = (date: string): string | undefined => {
  if (!date) return 'Date is required';
  if (!ValidationPatterns.date.test(date))
    return 'Please enter a valid date (YYYY-MM-DD)';
  return undefined;
};

export const validateTime = (time: string): string | undefined => {
  if (!time) return 'Time is required';
  if (!ValidationPatterns.time.test(time))
    return 'Please enter a valid time (HH:MM)';
  return undefined;
};

export const validateNumeric = (
  value: string,
  fieldName: string
): string | undefined => {
  if (!value) return `${fieldName} is required`;
  if (!ValidationPatterns.numeric.test(value))
    return `${fieldName} must be a number`;
  const num = parseInt(value);
  if (num <= 0) return `${fieldName} must be a positive number`;
  return undefined;
};

export const validateMedicationName = (name: string): string | undefined => {
  if (!name) return 'Medication name is required';
  if (!ValidationPatterns.medicationName.test(name))
    return 'Medication name must be 2-50 alphanumeric characters, spaces, or hyphens';
  return undefined;
};

export const validateDosage = (dosage: string): string | undefined => {
  if (!dosage) return 'Dosage is required';
  if (!ValidationPatterns.dosage.test(dosage))
    return 'Dosage must be 2-20 alphanumeric characters, spaces, or hyphens';
  return undefined;
};

export const validateFrequency = (frequency: string): string | undefined => {
  if (!frequency) return 'Frequency is required';
  if (!ValidationPatterns.frequency.test(frequency))
    return 'Frequency must be 2-50 alphanumeric characters, spaces, or hyphens';
  return undefined;
};

export const validateDuration = (duration: string): string | undefined => {
  if (!duration) return 'Duration is required';
  if (!ValidationPatterns.duration.test(duration))
    return 'Duration must be 2-20 alphanumeric characters, spaces, or hyphens';
  return undefined;
};
