import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe puro que formatea una fecha como cadena legible en español.
 * Al ser un pipe puro, Angular lo ejecuta una sola vez por valor
 * único, evitando crear objetos Date en cada ciclo de detección.
 */
@Pipe({
  name: 'formatoFecha',
  standalone: true,
  pure: true
})
export class FormatoFechaPipe implements PipeTransform {
  transform(fecha: string | Date | null | undefined): string {
    if (!fecha) return 'N/A';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }
}
