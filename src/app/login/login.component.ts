import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  user: string = '';
  pass: string = '';

  constructor(private http: HttpClient, private router: Router) {}
  //Iniciar sessió
  login() {
    this.http.post<any>('/api/login', { user: this.user, pass: this.pass }).subscribe({next: res => {
      localStorage.setItem('token', res.token);
        const payload = JSON.parse(atob(res.token.split('.')[1]));
        //Redirigir l'usuari en funció del seu rol
        if (payload.rol === 'alumne') {
          this.router.navigate(['/entrenaments-assignats']);
        } else {
          this.router.navigate(['/accio']);
        }
    },
    error: error => {
      console.error('Error en l\'inici de sessió:', error);
      alert('Usuari o contrasenya incorrectes.');
    }
    });
  }
}
