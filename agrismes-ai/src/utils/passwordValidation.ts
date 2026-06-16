export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password),
    get isValid() {
      return this.hasMinLength && this.hasUppercase && this.hasNumber && this.hasSpecialChar;
    }
  };
}

export const passwordRequirements = [
  { key: 'hasMinLength', label: 'At least 8 characters' },
  { key: 'hasUppercase', label: 'At least 1 uppercase letter' },
  { key: 'hasNumber', label: 'At least 1 number' },
  { key: 'hasSpecialChar', label: 'At least 1 special character' },
] as const;
