import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarEntrenamentComponent } from './seleccionar-entrenament.component';

describe('SeleccionarEntrenamentComponent', () => {
  let component: SeleccionarEntrenamentComponent;
  let fixture: ComponentFixture<SeleccionarEntrenamentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarEntrenamentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionarEntrenamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
