import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seleccionar-accio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccionar-accio.component.html',
  styleUrls: ['./seleccionar-accio.component.css']
})
export class SeleccionarAccioComponent {

  rol: string = '';
  
  constructor(private router: Router) {
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
}