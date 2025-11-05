import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswComponent } from './reset-passw.component';

describe('ResetPasswComponent', () => {
  let component: ResetPasswComponent;
  let fixture: ComponentFixture<ResetPasswComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
