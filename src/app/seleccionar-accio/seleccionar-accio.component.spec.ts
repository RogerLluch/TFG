import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarAccioComponent } from './seleccionar-accio.component';

describe('SeleccionarAccioComponent', () => {
  let component: SeleccionarAccioComponent;
  let fixture: ComponentFixture<SeleccionarAccioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarAccioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionarAccioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
