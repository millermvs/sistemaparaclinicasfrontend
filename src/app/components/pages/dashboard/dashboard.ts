import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Navbar, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  private http = inject(HttpClient);

  idClinica = 1;
  totalMedicos = signal<number>(0);
  mensagemMedico = signal<string>('');
  totalPacientes = signal<number>(0);
  mensagemPaciente = signal<string>('');

  ngOnInit() {
    this.consultarMedicos();
    this.consultarPacientes();
  }

  private readonly endPointMedicos = `${environment.api.clinicas}/${this.idClinica}/medicos?page=0&size=1`

  consultarMedicos() {
    let endpointConsultar = this.endPointMedicos;
    this.http.get(endpointConsultar).subscribe({
      next: (response: any) => {
        this.totalMedicos.set(response.totalElements);
      },
      error: (e: any) => {
        this.mensagemMedico.set(e.error.errors);
      }
    });
  }

  private readonly endPointPacientes = `${environment.api.pacientes}?nome=&page=0&size=1`

  consultarPacientes() {
    let endpointConsultar = this.endPointPacientes;
    this.http.get(endpointConsultar).subscribe({
      next: (response: any) => {
        this.totalPacientes.set(response.totalElements);
      },
      error: (e: any) => {
        this.mensagemPaciente.set(e.error.errors);
      }
    });
  }



}
