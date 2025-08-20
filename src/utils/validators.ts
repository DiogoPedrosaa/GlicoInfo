import CryptoJS from 'crypto-js';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMinLength = password.length >= 8;
  
  return hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
};

export const validateCPF = (cpf: string): boolean => {
  if (cpf.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validar dígitos verificadores
  const calcDigit = (cpf: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(cpf[i]) * (factor - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  
  const digit1 = calcDigit(cpf, 10);
  const digit2 = calcDigit(cpf, 11);
  
  return digit1 === parseInt(cpf[9]) && digit2 === parseInt(cpf[10]);
};

export const maskCPF = (cpf: string): string => {
  return cpf
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// Nova função para mascarar CPF para salvar no banco (ocultar primeiros dígitos)
export const maskCPFForSave = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length === 11) {
    return `***.***.***-${cleanCPF.slice(-2)}`;
  }
  return cpf;
};

export const hashCPF = (cpf: string): string => {
  return CryptoJS.SHA256(cpf).toString();
};