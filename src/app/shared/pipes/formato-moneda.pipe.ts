import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe puro que formatea un número como moneda MXN.
 * Al ser un pipe puro, Angular lo ejecuta una sola vez por valor
 * único (memoización automática), evitando recálculos costosos
 * en cada ciclo de detección de cambios.
 */
@Pipe({
  name: 'formatoMoneda',
  standalone: true,
  pure: true
})
export class FormatoMonedaPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  });

  transform(monto: number | string | null | undefined): string {
    return this.formatter.format(Number(monto) || 0);
  }
}
