import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pujar-musica',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './pujar-musica.component.html',
  styleUrls: ['./pujar-musica.component.css']
})
export class PujarMusicaComponent {
  youtubeLink: string = '';
  titol: string = '';
  artista: string = '';
  duracio: number = 0;
  bpm: number = 0;
  intensitat: string = '';
  mostrarFormulari: boolean = false;
  isLoading: boolean = false;
  missatgeError: string = '';
  rol: string = '';
  bloquejarLink: boolean = false;

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
  //Convertir els segons a format mm:ss
  convertirMinuts(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  //Boto cancel·lar per pujar un altre link
  cancelarAnalisi() {
    this.mostrarFormulari = false;
    this.bloquejarLink = false;
  }
  //Buscar la cançó a partir del link de YouTube per obtenir les dades
  buscarCanco() {
    this.bloquejarLink = true;
    this.isLoading = true;
    this.mostrarFormulari = false;
    this.http.post<{message: string, path: string, bpm: number, duracio: number, titol: string}>('/api/buscar-canco', { url: this.youtubeLink }).subscribe({
      next: (response) => {
        this.titol = response.titol;
        this.duracio = response.duracio;
        this.bpm = response.bpm;
        this.isLoading = false;
        this.mostrarFormulari = true;
      }, error: (error) => {
        console.error('Error buscant video:', error);
        this.missatgeError = 'Error al descarregar o analitzar l\'audio. Verifica el link i torna a intentar-ho.';
        this.isLoading = false;
        this.bloquejarLink = false;
      }
    });
  }
  //Inserir la cançó a la base de dades
  pujarCanco() {
    //Comprovar els camps obligatoris
    if (!this.titol || !this.artista || !this.duracio) {
      this.missatgeError = 'Títol, artista i duració són camps obligatoris.';
      return;
    }

    this.intensitat = this.calcularIntensitat(this.bpm);
    //Crear l'objecte cançó amb les dades obtingudes de l'anàlisi
    const canco = {
      titol: this.titol,
      duracio: this.duracio,
      bpm: this.bpm,
      intensitat: this.intensitat,
      artista: this.artista,
      link: this.youtubeLink
    };

    this.http.post<{message: string}>('/api/pujar-canco', canco).subscribe({
      next: (response) => {
        console.log('Canço pujada:', response);
        this.navigateTo('musica');
        alert('Cançó inserida a la base de dades.');
      },
      error: (error) => {
        console.error('Error en pujar la cançó:', error);
        alert('Error en inserir la cançó.');
        this.missatgeError = 'Error en pujar la cançó. Intenta-ho de nou.';
      }
    });
  }
  //Calcular la intensitat de la cançó a partir dels BPM
  calcularIntensitat(bpm: number): string {
    if (bpm >= 130) {
      return 'Alt';
    } else if (bpm >= 95) {
      return 'Mig';
    } else {
      return 'Baix';
    }
  }

}