import { TestBed } from '@angular/core/testing';

import { SemanasService } from './semanas.service';

describe('SemanasService', () => {
  let service: SemanasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SemanasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
