import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollCustomerComponent } from './enroll-customer.component';

describe('EnrollCustomerComponent', () => {
  let component: EnrollCustomerComponent;
  let fixture: ComponentFixture<EnrollCustomerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnrollCustomerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnrollCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
