import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dummy } from './dummy.component';

describe('Dummy', () => {
  let component: Dummy;
  let fixture: ComponentFixture<Dummy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dummy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dummy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
