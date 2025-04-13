export const ValidationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    loginPassword: /^.{6,}$/, 
    phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{3,6}$/,
    name: /^[a-zA-Z\u00C0-\u017F\s'-]{2,50}$/,
    licenseNumber: /^[A-Za-z0-9-]{6,20}$/,
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    numeric: /^[0-9]+$/,
  };
  
  export const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    if (!ValidationPatterns.email.test(email))
      return 'Please enter a valid email address';
    return null;
  };
  
  export const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!ValidationPatterns.password.test(password)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return null;
  };
  
  export const validateLoginPassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };
  
  export const validateConfirmPassword = (
    password: string,
    confirmPassword: string
  ): string | null => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };
  
  export const validatePhone = (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    if (!ValidationPatterns.phone.test(phone))
      return 'Please enter a valid phone number';
    return null;
  };
  
  export const validateName = (name: string): string | null => {
    if (!name) return `Name is required`;
    if (!ValidationPatterns.name.test(name))
      return `Name must be 2-50 valid characters`;
    return null;
  };
  
  export const validateLicenseNumber = (license: string): string | null => {
    if (!license) return 'License number is required';
    if (!ValidationPatterns.licenseNumber.test(license)) {
      return 'License number must be 6-20 alphanumeric characters';
    }
    return null;
  };
  
  export const validateDate = (date: string): string | null => {
    if (!date) return 'Date is required';
    if (!ValidationPatterns.date.test(date))
      return 'Please enter a valid date (YYYY-MM-DD)';
    return null;
  };
  
  export const validateTime = (time: string): string | null => {
    if (!time) return 'Time is required';
    if (!ValidationPatterns.time.test(time))
      return 'Please enter a valid time (HH:MM)';
    return null;
  };
  
  export const validateNumeric = (
    value: string,
    fieldName: string
  ): string | null => {
    if (!value) return `${fieldName} is required`;
    if (!ValidationPatterns.numeric.test(value))
      return `${fieldName} must be a number`;
    return null;
  };

  



