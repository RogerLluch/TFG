import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarMusicaComponent } from './seleccionar-musica.component';

describe('SeleccionarMusicaComponent', () => {
  let component: SeleccionarMusicaComponent;
  let fixture: ComponentFixture<SeleccionarMusicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarMusicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionarMusicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
