import { Routes } from '@angular/router';
import { SeleccionarAccioComponent } from './seleccionar-accio/seleccionar-accio.component';
import { SeleccionarEntrenamentComponent } from './seleccionar-entrenament/seleccionar-entrenament.component';
import { SeleccionarMusicaComponent } from './seleccionar-musica/seleccionar-musica.component';
import { PujarMusicaComponent } from './pujar-musica/pujar-musica.component';
import { CrearEntrenamentComponent } from './crear-entrenament/crear-entrenament.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'accio', component: SeleccionarAccioComponent},
    { path: 'musica', component: SeleccionarMusicaComponent},
    { path: 'pujar', component: PujarMusicaComponent},
    { path: 'entrenaments', component: SeleccionarEntrenamentComponent},
    { path: 'crear', component: CrearEntrenamentComponent},
    { path: 'entrenaments-assignats', component: SeleccionarEntrenamentComponent},
    { path: '**', redirectTo: '' }
];