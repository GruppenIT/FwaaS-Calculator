import { describe, it, expect } from 'vitest';
import { validarNumeroCnj } from './processo.js';

describe('validarNumeroCnj', () => {
  it('aceita número CNJ válido', () => {
    expect(validarNumeroCnj('0002345-67.2023.8.26.0100')).toBe(true);
  });

  it('aceita outro número CNJ válido (TRF)', () => {
    expect(validarNumeroCnj('5001234-89.2024.4.03.6100')).toBe(true);
  });

  it('rejeita número sem formatação', () => {
    expect(validarNumeroCnj('00023456720238260100')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(validarNumeroCnj('')).toBe(false);
  });

  it('rejeita formato parcial', () => {
    expect(validarNumeroCnj('0002345-67.2023')).toBe(false);
  });
});
