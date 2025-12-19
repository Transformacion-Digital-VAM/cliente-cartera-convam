import { TestBed } from '@angular/core/testing';

import { AvalesService } from './avales.service';

describe('AvalesService', () => {
  let service: AvalesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AvalesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
