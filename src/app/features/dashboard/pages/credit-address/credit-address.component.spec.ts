import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditAddressComponent } from './credit-address.component';

describe('CreditAddressComponent', () => {
  let component: CreditAddressComponent;
  let fixture: ComponentFixture<CreditAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditAddressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
