import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { formatARS, formatDateBuenosAires } from '../lib/utils';

describe('Utilidades de formato Argentino (es-AR)', () => {
  it('formatea la moneda ARS con separador de miles y centavos ($ 1.234,50)', () => {
    expect(formatARS(1234.5)).toBe('$ 1.234,50');
    expect(formatARS(1500)).toBe('$ 1.500,00');
    expect(formatARS(0)).toBe('$ 0,00');
    expect(formatARS(10500250.75)).toBe('$ 10.500.250,75');
  });

  it('formatea fechas en zona horaria America/Argentina/Buenos_Aires', () => {
    // 2026-10-12T15:30:00Z en UTC es 12:30:00 en Buenos Aires (UTC-3)
    const formatted = formatDateBuenosAires('2026-10-12T15:30:00Z');
    expect(formatted).toContain('12:30');
    expect(formatted).toContain('12/10/2026');
  });
});

describe('Componente App principal', () => {
  it('renderiza el encabezado TRONNO, enlaces de navegación y botón de login', () => {
    render(<App />);
    const brandTitles = screen.getAllByText(/TRONNO/i);
    expect(brandTitles.length).toBeGreaterThan(0);
    expect(screen.getByText('Mis reservas')).toBeInTheDocument();
    expect(screen.getByText('Espacio Vendedor')).toBeInTheDocument();
    expect(screen.getByText('Ingresar')).toBeInTheDocument();
    expect(screen.getByText('Usar mi ubicación')).toBeInTheDocument();
  });
});
