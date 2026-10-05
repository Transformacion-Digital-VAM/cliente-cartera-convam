import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpensesIncomeComponent } from './expenses-income.component';

describe('ExpensesIncomeComponent', () => {
  let component: ExpensesIncomeComponent;
  let fixture: ComponentFixture<ExpensesIncomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesIncomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpensesIncomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
