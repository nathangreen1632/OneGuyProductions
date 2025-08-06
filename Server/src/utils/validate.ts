export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 letter, 1 number (tweak as needed)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&^_-]{8,}$/;
  return passwordRegex.test(password);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateSignupInput(input: {
  username: string;
  email: string;
  password: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.username)) {
    errors.push('Username is required.');
  }

  if (!isValidEmail(input.email)) {
    errors.push('Invalid email address.');
  }

  if (!isValidPassword(input.password)) {
    errors.push('Password must be at least 8 characters and contain at least one number.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLoginInput(input: {
  email: string;
  password: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isValidEmail(input.email)) {
    errors.push('Invalid email address.');
  }

  if (!isNonEmptyString(input.password)) {
    errors.push('Password is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
