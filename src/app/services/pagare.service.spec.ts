import { TestBed } from '@angular/core/testing';

import { PagareService } from './pagare.service';

describe('PagareService', () => {
  let service: PagareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
