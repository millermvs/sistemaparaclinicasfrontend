import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Navbar, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  private http = inject(HttpClient);

  totalMedicos = signal<number>(0);
  mensagemMedico = signal<string>('');

  ngOnInit() {
    this.consultarMedicos();
  }

  private readonly baseUrl = 'http://localhost:8080/api/v1/clinicas/1/medicos?page=0&size=1';

  consultarMedicos() {
    let endpointConsultar = this.baseUrl;
    this.http.get(endpointConsultar).subscribe({
      next: (response: any) => {
        this.totalMedicos.set(response.totalElements);
      },
      error: (e: any) => {
        this.mensagemMedico.set(e.error.errors);
      }
    });
  }
}
