import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinistracionComponent } from './ministracion.component';

describe('MinistracionComponent', () => {
  let component: MinistracionComponent;
  let fixture: ComponentFixture<MinistracionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinistracionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinistracionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
