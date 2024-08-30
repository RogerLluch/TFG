import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEntrenamentComponent } from './crear-entrenament.component';

describe('CrearEntrenamentComponent', () => {
  let component: CrearEntrenamentComponent;
  let fixture: ComponentFixture<CrearEntrenamentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearEntrenamentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearEntrenamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
