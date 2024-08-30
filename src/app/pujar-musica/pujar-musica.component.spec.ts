import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PujarMusicaComponent } from './pujar-musica.component';

describe('PujarMusicaComponent', () => {
  let component: PujarMusicaComponent;
  let fixture: ComponentFixture<PujarMusicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PujarMusicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PujarMusicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
