import { Component, ElementRef, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, Navbar, RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  idClinica = 1;

  // Totais (cards)
  totalMedicos = signal<number>(0);
  totalPacientes = signal<number>(0);
  totalConsultasHoje = signal<number>(0);
  totalConsultasMes = signal<number>(0);

  // Mensagens
  mensagemMedicos = signal<string>('');
  mensagemPacientes = signal<string>('');
  mensagemConsultasHoje = signal<string>('');
  mensagemConsultasMes = signal<string>('');

  // Datas
  hoje = new Date();
  dataHoje = `${this.hoje.getFullYear()}-${String(this.hoje.getMonth() + 1).padStart(2, '0')}-${String(this.hoje.getDate()).padStart(2, '0')}`;

  primeiroDia = `${this.hoje.getFullYear()}-${String(this.hoje.getMonth() + 1).padStart(2, '0')}-01`;
  ultimoDia = `${this.hoje.getFullYear()}-${String(this.hoje.getMonth() + 1).padStart(2, '0')}-${String(new Date(this.hoje.getFullYear(), this.hoje.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

  // ======= NOVO (select + lista) =======

  // Lista de médicos pro select
  medicos = signal<any[]>([]);

  // Lista de consultas do dia (abaixo do select)
  consultasHoje = signal<any[]>([]);

  // Form do filtro (no teu padrão)
  formFiltroConsultas = this.fb.group({
    idMedico: [''] // '' = todos
  });

  ngOnInit() {
    this.consultarMedicos();
    this.consultarPacientes();
    this.buscarConsultasHoje();  // total no card
    this.buscarConsultasMes();   // total no card

    // Novo
    this.buscarMedicosSelect();
    this.buscarListaConsultasDoDia(); // lista inicial = todos

    // quando trocar o select, busca lista de novo
    this.formFiltroConsultas.get('idMedico')?.valueChanges.subscribe(() => {
      this.buscarListaConsultasDoDia();
    });
  }

  // =======================
  // CARDS (já funcionando)
  // =======================

  private readonly endPointMedicos = `${environment.api.clinicas}/${this.idClinica}/medicos?page=0&size=1`;

  consultarMedicos() {
    const endpointConsultar = this.endPointMedicos;
    this.http.get(endpointConsultar).subscribe({
      next: (response: any) => {
        this.totalMedicos.set(response.totalElements);
      },
      error: (e: any) => {
        this.mensagemMedicos.set(e.error?.message || 'erro ao consultar médicos.');
      }
    });
  }

  private readonly endPointPacientes = `${environment.api.pacientes}?nome=&page=0&size=1`;

  consultarPacientes() {
    const endpointConsultar = this.endPointPacientes;
    this.http.get(endpointConsultar).subscribe({
      next: (response: any) => {
        this.totalPacientes.set(response.totalElements);
      },
      error: (e: any) => {
        this.mensagemPacientes.set(e.error?.message || 'erro ao consultar pacientes.');
      }
    });
  }

  private endpointBaseConsultasHoje = `${environment.api.consultas}/datas`;

  buscarConsultasHoje() {
    const url = `${this.endpointBaseConsultasHoje}/${this.dataHoje}/${this.dataHoje}?page=0&size=1`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        this.totalConsultasHoje.set(response.totalElements);
      },
      error: (e: any) => {
        this.mensagemConsultasHoje.set((e.error?.message ? e.error.message + ' para hoje.' : '') || 'erro ao consultar dados das consultas diárias.');
      }
    });
  }

  private endpointBaseConsultasMes = `${environment.api.consultas}/datas`;

  buscarConsultasMes() {
    const url = `${this.endpointBaseConsultasMes}/${this.primeiroDia}/${this.ultimoDia}?page=0&size=1`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        this.totalConsultasMes.set(response.totalElements);
      },
      error: (e: any) => {
        this.mensagemConsultasMes.set((e.error?.message ? e.error.message + ' para este mês.' : '') || 'erro ao consultar dados das consultas mensais.');
      }
    });
  }

  // =======================
  // NOVO: SELECT DE MÉDICOS
  // =======================

  buscarMedicosSelect() {
    this.http.get(`${environment.api.medicos}/ativos`)
      .subscribe({
        next: (response: any) => {
          this.medicos.set(response || []);
        },
        error: () => {
          this.medicos.set([]);
        }
      });
  }

  // =========================================
  // NOVO: LISTA DE CONSULTAS DO DIA (no card)
  // =========================================
  // - Se idMedico = '' => usa /datas (paginado)
  // - Se idMedico preenchido => usa /medico (como você já faz em Consultas.ts)
  //
  // OBS: aqui eu puxo size=50 para ter "lista do dia" decente
  // Se quiser paginar depois.
  buscarListaConsultasDoDia() {
    const idMedico = this.formFiltroConsultas.get('idMedico')?.value;

    const dataInicio = this.dataHoje;
    const dataFim = this.dataHoje;

    const urlData = `${environment.api.consultas}/datas/${dataInicio}/${dataFim}?page=0&size=50`;
    const urlDataMedico = `${environment.api.consultas}/medico?idMedico=${idMedico}&dataInicio=${dataInicio}&dataFim=${dataFim}`;

    let url = '';
    if (idMedico === '' || idMedico == null) {
      url = urlData;
    } else {
      url = urlDataMedico;
    }

    this.http.get(url).subscribe({
      next: (response: any) => {
        // se vier paginado:
        const lista = response.content || response || [];
        this.consultasHoje.set(lista);
      },
      error: () => {
        this.consultasHoje.set([]);
      }
    });
  }
}
