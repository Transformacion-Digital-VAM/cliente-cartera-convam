import { TestBed } from '@angular/core/testing';

import { AliadoService } from './aliado.service';

describe('AliadoService', () => {
  let service: AliadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AliadoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
