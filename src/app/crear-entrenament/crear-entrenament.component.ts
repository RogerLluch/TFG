import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';


@Component({
  selector: 'app-crear-entrenament',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './crear-entrenament.component.html',
  styleUrl: './crear-entrenament.component.css'
})
export class CrearEntrenamentComponent {
  nom: string = '';
  duracioEntrenament: number = 0;
  activitats: any[] = [{temps: 0, intensitat: ''}];
  activitatSeleccionada: any[] = [];
  revisat: boolean = false;
  missatgeError: string = '';
  mostrarSelectorCancons: boolean = false;
  cancoEditar: any = { indexActivitat: 0, indexCanco: 0, cancons: [] };
  afegirNovaCanco: boolean = false;
  rol: string = '';


  constructor(private http: HttpClient, private router: Router) {
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
  //Afegir una nova activitat a l'entrenament
  afegirActivitat() {
    this.activitats.push({temps: 0, intensitat: ''});
  }
  //Eliminar l'activitat de l'entrenament
  eliminarActivitat(index: number) {
    this.activitats.splice(index, 1);
    this.actualitzarDuracio();
  }
  //Actualitzar la duració total de l'entrenament
  actualitzarDuracio() {
    this.duracioEntrenament = this.activitats.reduce((totalTemps, activitat) => totalTemps + activitat.temps, 0);
  }
  //Comprovar que tots els camps estan complets
  validarCamps(): boolean {
    if(!this.nom.trim()) {
      this.missatgeError = 'És obligatori indicar un nom per a l\'entrenament';
      return false;
    }

    for (const activitat of this.activitats) {
      if(activitat.temps <= 0) {
        this.missatgeError = 'La duració de les activitats ha de ser superior a 0';
        return false;
      }
      if(!activitat.intensitat) {
        this.missatgeError = 'És obligatori indicar una intensitat per a les activitats';
        return false;
      }
    }
    this.missatgeError = '';
    return true;
  }
  //Inserir l'entrenament a la base de dades
  crearEntrenament() {
    if (!this.revisat) {
        this.plenarCancons();
        return;
    }
    
    if (!this.activitatSeleccionada || this.activitatSeleccionada.length === 0) {
        this.missatgeError = 'No s\'han seleccionat cançons per a les activitats';
        return;
    }
    
    const entrenament = {
      nom: this.nom,
      activitats: this.activitatSeleccionada.map((elementLlista: any, indexActivitat: number) => ({
          temps: elementLlista.activitat.temps,
          intensitat: elementLlista.activitat.intensitat,
          idact: indexActivitat + 1,
          cancons: elementLlista.cancons.map((canco: any, indexCanco: number) => ({
              idcanco: canco.id,
              ordre: indexCanco + 1,
          }))
      }))
    };
    //inserir l'entrenament a la base de dades
    this.http.post('/api/entrenament', entrenament).subscribe({next: response => {
      const identre = (response as { id: number }).id;
      //Per a cada activitat, inserir les cançons amb l'ordre corresponent
      entrenament.activitats.forEach((activitat: any) => {
        activitat.cancons.forEach((canco: any) => {
            this.http.post('api/ordre', {
              identre, 
              idact: activitat.idact, 
              idcanco: canco.idcanco, 
              ordre: canco.ordre
            }).subscribe({next: response => {
              console.log('Cançó inserida amb l\'ordre corresponent', response);
            }, error: error => {
              console.error('Error creant l\'ordre de les cançons:', error);
            }
            });
        });
      });
      
      console.log('Entrenament creat:', response);
      // Netejar formulari 
      this.nom = '';
      this.duracioEntrenament = 0;
      this.activitats = [{temps: 0, intensitat: ''}];
      this.activitatSeleccionada = [];
      this.revisat = false;
      this.navigateTo('entrenaments');
      alert('Entrenament creat amb èxit.');
    },
    error: error => {
      console.error('Error creant entrenament:', error);
    }
    });
  }
  //Cercar cançons per a les activitats
  plenarCancons() {
    //Abans de plenar cançons, comprovar que tots els camps estan complets
    if (!this.validarCamps()) {
      return;
    }
    //Per a cada activitat, cercar cançons amb la intensitat corresponent
    const seleccions = this.activitats.map((activitat: any) => {
      console.log(`Buscant cançons per a la intensitat: ${activitat.intensitat}`);
      return this.http.get<any[]>(`/api/cancoINT?intensitat=${activitat.intensitat}`).toPromise();
    });
    //Esperar a que totes les cerques s'hagin completat
    Promise.all(seleccions).then((resultats: any[]) => {
      console.log('Resultats de les cerques de cançons:', resultats);
      let duracioTotalEntrenament = 0;
      this.activitatSeleccionada = resultats.map((cancons, index) => {
        let activitatSeleccionada: any[] = [];
        let tempsTotal = 0;
        let indexCanco = 0;

        //Seleccionar cançons fins a arribar a la duració de l'activitat
        while (tempsTotal < this.activitats[index].temps * 60) {
          // Reiniciar index si hi ha menys cançons que la duració total de l'activitat
          if (indexCanco >= cancons.length) {
            indexCanco = 0;
          }

          const canco = cancons[indexCanco];
          activitatSeleccionada.push(canco);
          tempsTotal += canco.duracio;
          indexCanco++;
        }

        //Actualitzar la duració de l'activitat
        this.activitats[index].temps = Math.round(tempsTotal / 60);
        duracioTotalEntrenament += this.activitats[index].temps;
        console.log(`Cançons seleccionades per a l'activitat ${index}:`, activitatSeleccionada);
        return {
          activitat: this.activitats[index],
          cancons: activitatSeleccionada
        };
      });
      //Actualitzar la duració total de l'entrenament
      this.duracioEntrenament = duracioTotalEntrenament;
      this.revisat = true;
    }).catch(error => {
      console.error('Error cercant cancons:', error);
    });
  }
  //Editar una cançó de l'activitat per una altra de la mateixa intensitat
  editarCanco(indexActivitat: number, indexCanco: number) {
    console.log('Editant activitat i cançó:', indexActivitat, indexCanco);
    const intensitat = this.activitatSeleccionada[indexActivitat].activitat.intensitat;
    this.http.get<any[]>(`/api/cancoINT?intensitat=${intensitat}`).subscribe(cancons => {
      this.cancoEditar = { indexActivitat, indexCanco, cancons };
      this.mostrarSelectorCancons = true;
      this.afegirNovaCanco = false;
    });
  }
  //Afegir una nova cançó de la mateixa intensitat a l'activitat
  afegirCanco(indexActivitat: number) {
    const intensitat = this.activitatSeleccionada[indexActivitat].activitat.intensitat;
    this.http.get<any[]>(`/api/cancoINT?intensitat=${intensitat}`).subscribe(cancons => {
      this.cancoEditar = { indexActivitat, indexCanco: this.activitatSeleccionada[indexActivitat].cancons.length, cancons };
      this.mostrarSelectorCancons = true;
      this.afegirNovaCanco = true;
    });
  }
  //Eliminar una cançó de l'activitat
  eliminarCanco(indexActivitat: number, indexCanco: number) {
    const cancoActual = this.activitatSeleccionada[indexActivitat].cancons[indexCanco];
    this.activitatSeleccionada[indexActivitat].cancons.splice(indexCanco, 1);
    const difTemps = -cancoActual.duracio;

    this.activitats[indexActivitat].temps += Math.round(difTemps / 60);
    this.duracioEntrenament += Math.round(difTemps / 60);
  }
  //Tancar la llista de cançons
  tancarSelectorCancons() {
    this.mostrarSelectorCancons = false;
  }
  //Seleccionar una nova cançó per l'activitat(tant per editar com per afegir)
  seleccionarNovaCanco(novaCanco: any) {
    const { indexActivitat, indexCanco } = this.cancoEditar;
    //Si "afegirNovaCanco" és true, s'afegirà una nova cançó a l'activitat i sino es reemplaçarà la cançó actual
    if (this.afegirNovaCanco) {
      //Afegir la nova cançó i actualitzar la duració
      this.activitatSeleccionada[indexActivitat].cancons.push(novaCanco);
      this.activitats[indexActivitat].temps += Math.round(novaCanco.duracio / 60);
      this.duracioEntrenament += Math.round(novaCanco.duracio / 60);
    } else {
      //Reemplaçar la cançó i actualitzar la duració
      const cancoActual = this.activitatSeleccionada[indexActivitat].cancons[indexCanco];
      const difTemps = novaCanco.duracio - cancoActual.duracio;
      this.activitatSeleccionada[indexActivitat].cancons[indexCanco] = novaCanco;
      this.activitats[indexActivitat].temps += Math.round(difTemps / 60);
      this.duracioEntrenament += Math.round(difTemps / 60);
    }

    this.mostrarSelectorCancons = false;
  }
  //Confirmar les cançons i crear l'entrenament
  confirmarCancons() {
    this.revisat = true;
    this.crearEntrenament();
  }

}