import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-seleccionar-musica',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './seleccionar-musica.component.html',
  styleUrl: './seleccionar-musica.component.css'
})
export class SeleccionarMusicaComponent implements OnInit {
  
  cancons: any[] = [];
  llistaCancons: any[] = [];
  obrirMenu = false;
  rangBPM: number[] = [0, 200];
  intensitatsSeleccionades: Set<string> = new Set();
  intensitatAlta: boolean = false;
  intensitatMitja: boolean = false;
  intensitatBaixa: boolean = false;
  rol: string = '';



  constructor(private router: Router, private http: HttpClient) {  
    this.rol = this.obtindreRol();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  obtindreRol(): string {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol;
    }
    return '';
  }

  ngOnInit() {
    this.getCancons();
  }

  convertirMinuts(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  //Obtenir totes les cançons de la base de dades
  getCancons() {
    this.http.get<any[]>('/api/cancons').subscribe({next:data => {
      this.cancons = data;
      this.llistaCancons = [...this.cancons];
    }, error: error => {
      alert('Error obtenint cançons.');
      console.error('Error obtenint les cançons:', error);
    }
    });
  }
  //Filtrar la llista de cançons per nom
  filtrarLlista() {
    const searchInput = (document.getElementById('busqueda') as HTMLInputElement).value.toLowerCase();
    this.llistaCancons = this.cancons.filter(canco =>
      canco.titol.toLowerCase().includes(searchInput)
    );
  }
  //Obrir i tancar el menú de filtres
  menuFiltres() {
    this.obrirMenu = !this.obrirMenu;
  }
  //Aplicar els filtres seleccionats al menú
  aplicarFiltres() {
    //Filtres intensitat
    this.intensitatsSeleccionades.clear();
    if (this.intensitatAlta) {
      this.intensitatsSeleccionades.add('Alt');
    }
    if (this.intensitatMitja) {
      this.intensitatsSeleccionades.add('Mig');
    }
    if (this.intensitatBaixa) {
      this.intensitatsSeleccionades.add('Baix');
    }
    //Filtres BPM
    this.llistaCancons = this.cancons.filter(canco =>
      canco.bpm >= this.rangBPM[0] &&
      canco.bpm <= this.rangBPM[1] &&
      (this.intensitatsSeleccionades.size === 0 || this.intensitatsSeleccionades.has(canco.intensitat))
    );
    this.obrirMenu = false;
  }
  //Netejar els filtres seleccionats al menú
  netejarFiltres() {
    this.rangBPM = [0, 200];
    this.intensitatsSeleccionades.clear();
    this.intensitatAlta = false;
    this.intensitatMitja = false;
    this.intensitatBaixa = false;
    this.llistaCancons = [...this.cancons];
    this.obrirMenu = false;
  }

}