import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}
@Component({
  selector: 'app-seleccionar-entrenament',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './seleccionar-entrenament.component.html',
  styleUrls: ['./seleccionar-entrenament.component.css']
})
export class SeleccionarEntrenamentComponent implements OnInit {
  entrenaments: any[] = [];
  selectedEntrenament: any = null; 
  entrenamentDetails: any[] = [];
  reproductorDetails: any[] = [];
  currentSongIndex: number = 0;
  player: YT.Player | null = null;
  mostrarReproductor: boolean = false;
  rol: string = '';
  alumnes: any[] = [];
  alumnesAssignats: any[] = [];
  mostrarAssignar: boolean = false;
  mostrarDesassignar: boolean = false;
  
  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.rol = this.obtindreRol();
    this.obtindreEntrenaments();
    this.inciarAPIYouTube();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  obtindreRol(): string {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol;
    }
    return '';
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
  //Obtenir els entrenaments de la base de dades en funció del rol de l'usuari
  obtindreEntrenaments() {
    let backend = '/api/entrenaments';
    if (this.rol === 'alumne') {
      backend = `/api/entrenaments-alumne?iduser=${this.obtindreIdUser()}`;
    }
    this.http.get<any[]>(backend).subscribe({next: data => {
        this.entrenaments = data;
      },
      error: error => {
        alert('Error obtenint els entrenaments.');
        console.error('Error buscant entrenaments:', error);
      }
    });
  }
  //Obtenir l'identificador de l'alumne per a mostrar els seus entrenaments
  obtindreIdUser(): number {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    }
    return 0;
  }
  //Mostrar els detalls de l'entrenament seleccionat
  mostrarEntrenament(entrenament: any) {
    this.selectedEntrenament = entrenament;
    const id = entrenament.id;
    this.http.get<any>(`/api/entrenament/${id}`).subscribe({next: data => {
        if (Array.isArray(data.activities)) {
          this.entrenamentDetails = data.activities;
        } else {
          console.error('Error: No s\'han trobat activitats:', data.activities);
          this.entrenamentDetails = [];
        }
      },
      error: error => {
        alert('Error buscant l\'entrenament.');
        console.error('Error buscant l\'entrenament:', error);
      }
    });
  }
  //Eliminar l'entrenament seleccionat
  eliminarEntrenament(id: number) {
    if (this.rol !== 'professor' && this.rol !== 'admin') {
      alert('Els alumnes no poden eliminar entrenaments.');
      return;
    }
    this.http.delete(`/api/entrenament/${id}`).subscribe({next: data => {
      this.obtindreEntrenaments();
    },error: error => {
      alert('Error en eliminar l\'entrenament.');
      console.error('Error eliminant l\'entrenament:', error);
    }
    });
  }
  //Reproduir l'entrenament seleccionat(necessita el reproductor carregat)
  reproduirEntrenament(entrenament: any) {
    this.selectedEntrenament = entrenament;
    const id = entrenament.id;
    this.http.get<any[]>(`/api/reproduirEntrenament/${id}`).subscribe({next: data => {
        this.reproductorDetails = data;
        this.currentSongIndex = 0;
        this.mostrarReproductor = true;
        this.carregarVideo();
      },
      error: error => {
        alert('Error al reproduir l\'entrenament.');
        console.error('Error obtenint detalls de l\'entrenament:', error);
      }
    });
  }
  //Iniciar la API de YouTube
  inciarAPIYouTube() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag) {
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      console.error('Error al inserir el script de YouTube API');
      return;
    }
    
    window.onYouTubeIframeAPIReady = () => {
      this.player = new window.YT.Player('player', {
        events: {
          'onStateChange': this.canviEstat.bind(this),
        },
        playerVars: {
          autoplay: 1,
          controls: 1,
        },
      });
    };
  }
  //Carregar un video a partir del ID per a reproduir-lo
  carregarVideo() {
    if (this.reproductorDetails.length > 0 && this.player && typeof this.player.loadVideoById === 'function') {
      const song = this.reproductorDetails[this.currentSongIndex];
      const videoId = this.videoID(song.link);
      if (videoId) {
        this.player.loadVideoById(videoId);
      }
    } else {
      console.error('Reproductor no inicialitzat o no s\'ha trobat el videoId');
    }
  }
  //Detectar quan hi ha un canvi d'estat en el reproductor(un video acaba)
  canviEstat(event: YT.OnStateChangeEvent) {
    if (event.data === YT.PlayerState.ENDED) {
      this.currentSongIndex++;
      if (this.currentSongIndex < this.reproductorDetails.length) {
        this.carregarVideo();
      }
    }
  }
  //Extreure l'ID del video a partir de la URL
  videoID(url: string): string {
    const videoIdMatch = url.match(/[?&]v=([^&]+)/);
    return videoIdMatch ? videoIdMatch[1] : '';
  }
  //Mostrar els alumnes que no tenen l'entrenament assignat
  mostrarAlumnes(entrenament: any) {
    this.selectedEntrenament = entrenament;
    this.http.get<any[]>(`/api/usuaris-alumnes/${entrenament.id}`).subscribe({next: data => {
        this.alumnes = data;
        this.mostrarAssignar = true;
        this.mostrarDesassignar = false;
      },
      error: error => {
        console.error('Error obtenint alumnes:', error);
      }
    });
  }
  //Mostrar els alumnes que tenen l'entrenament assignat
  mostrarAssignats(entrenament: any) {
    this.selectedEntrenament = entrenament;
    this.http.get<any[]>(`/api/usuaris-assignats/${entrenament.id}`).subscribe({next: data => {
        this.alumnesAssignats = data;
        this.mostrarAssignar = false;
        this.mostrarDesassignar = true;
      },
      error: error => {
        console.error('Error obtenint alumnes assignats:', error);
      }
    });
  }
  //Assignar l'entrenament a l'alumne seleccionat
  assignarEntrenament(alumneId: number) {
    if (!this.selectedEntrenament) {
      console.error('No hi ha entrenament seleccionat');
      return;
    }
    const body = { iduser: alumneId, identre: this.selectedEntrenament.id };
    this.http.post('/api/assignar-entrenament', body).subscribe({next: () => {
        alert('Entrenament assignat amb èxit');
        this.mostrarAssignar = false;
      },
      error: error => {
        console.error('Error assignant entrenament:', error);
      }
    });
  }
  //Desassignar l'entrenament a l'alumne seleccionat
  desassignarEntrenament(alumneId: number) {
    if (!this.selectedEntrenament) {
      console.error('No hi ha entrenament seleccionat');
      return;
    }
    const body = { iduser: alumneId, identre: this.selectedEntrenament.id };
    this.http.delete(`/api/desassignar-entrenament/${alumneId}/${this.selectedEntrenament.id}`).subscribe({next: () => {
        alert('Entrenament desassignat amb èxit');
        this.mostrarDesassignar = false;
      },
      error: error => {
        console.error('Error desassignant entrenament:', error);
      }
    });
  }
}