// Input validation utilities

export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters except the leading +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Check if it starts with +
  if (!cleanPhone.startsWith('+')) {
    return { isValid: false, error: 'Phone number must start with country code (e.g., +91)' };
  }

  // Remove the + for length checking
  const digitsOnly = cleanPhone.substring(1);
  
  // Check minimum and maximum length (7-15 digits as per E.164 standard)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number must be 7-15 digits after country code' };
  }

  // Check if all characters after + are digits
  if (!/^\d+$/.test(digitsOnly)) {
    return { isValid: false, error: 'Phone number can only contain digits after country code' };
  }

  return { isValid: true };
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except the leading +
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // If doesn't start with +, assume it's an Indian number
  if (!cleanPhone.startsWith('+')) {
    const digits = cleanPhone.replace(/\D/g, '');
    // If it starts with 91, keep it, otherwise prepend 91
    cleanPhone = digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
  }
  
  return cleanPhone;
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

export const validateOTP = (otp: string): { isValid: boolean; error?: string } => {
  if (!otp) {
    return { isValid: false, error: 'OTP is required' };
  }

  if (otp.length !== 6) {
    return { isValid: false, error: 'OTP must be 6 digits' };
  }

  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, error: 'OTP can only contain digits' };
  }

  return { isValid: true };
};
