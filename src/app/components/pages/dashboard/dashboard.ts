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
  totalPacientes = signal<number>(0);
  totalConsultasHoje = signal<number>(0);
  totalConsultasMes = signal<number>(0);
  mensagemMedico = signal<string>('');
  mensagemPaciente = signal<string>('');
  mensagemConsultaHoje = signal<string>('');
  mensagemConsultaMes = signal<string>('');
  hoje = new Date();
  dataHoje = `${this.hoje.getFullYear()}-${String(this.hoje.getMonth() + 1).padStart(2, '0')}-${String(this.hoje.getDate()).padStart(2, '0')}`;

  primeiroDia = `${this.hoje.getFullYear()}-${String(this.hoje.getMonth() + 1).padStart(2, '0')}-01`;
  ultimoDia = `${this.hoje.getFullYear()}-${String(this.hoje.getMonth() + 1).padStart(2, '0')}-${String(new Date(this.hoje.getFullYear(), this.hoje.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

  ngOnInit() {
    this.consultarMedicos();
    this.consultarPacientes();
    this.buscarConsultasHoje();
    this.buscarConsultasMes();
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

  private endpointBaseConsultasHoje = `${environment.api.consultas}/datas`;

  buscarConsultasHoje() {
    const url =
      `${this.endpointBaseConsultasHoje}/${this.dataHoje}/${this.dataHoje}?page=0&size=1`;

    this.http.get(url)
      .subscribe({
        next: (response: any) => {
          this.totalConsultasHoje.set(response.totalElements);
        },
        error: (e: any) => {
          console.log(e)
          this.mensagemConsultaHoje.set(e.error.errors);
        }
      });
  }

  private endpointBaseConsultasMes = `${environment.api.consultas}/datas`;
 
   buscarConsultasMes() {
     const url =
       `${this.endpointBaseConsultasMes}/${this.primeiroDia}/${this.ultimoDia}?page=0&size=1`;
 
     this.http.get(url)
       .subscribe({
         next: (response: any) => {
           this.totalConsultasMes.set(response.totalElements);
         },
         error: (e: any) => {
           this.mensagemConsultaMes.set(e.error.errors);
         }
       });
   }



}
