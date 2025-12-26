import { TestBed } from '@angular/core/testing';

import { CalendarioPagoService } from './calendario-pago.service';

describe('CalendarioPagoService', () => {
  let service: CalendarioPagoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalendarioPagoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
