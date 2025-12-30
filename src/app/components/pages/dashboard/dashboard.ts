import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';

// ✅ angular-highcharts (o que você está usando agora)
import { ChartModule, Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';

type ResumoConsultasPorMedico = {
  nomeMedico: string;
  quantidadeConsultas: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    RouterLink,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ChartModule, // ✅ necessário para diretiva [chart]
  ],
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

  // Lista de médicos pro select
  medicos = signal<any[]>([]);

  // Lista de consultas do dia (abaixo do select)
  consultasHoje = signal<any[]>([]);

  // Form do filtro
  formFiltroConsultas = this.fb.group({
    idMedico: [''] // '' = todos
  });

  // Resumo p/ gráfico
  quantidadeConsultasPorMedicoMes = signal<ResumoConsultasPorMedico[]>([]);

  // =======================
  // GRÁFICO (angular-highcharts)
  // =======================
  chartConsultasPorMedico = signal<Chart | undefined>(undefined);

  constructor() {
    effect(() => {
      const resumo = this.quantidadeConsultasPorMedicoMes();

      if (!resumo || resumo.length === 0) {
        this.chartConsultasPorMedico.set(undefined);
        return;
      }

      // (extra sênior) ordena desc e pega top 10 pra não ficar ilegível
      const top10 = [...resumo]
        .sort((a, b) => (b.quantidadeConsultas ?? 0) - (a.quantidadeConsultas ?? 0))
        .slice(0, 10);

      const { categories, data } = this.buildChartData(top10);
      const options = this.buildChartOptions(categories, data);

      this.chartConsultasPorMedico.set(new Chart(options));
    });
  }

  ngOnInit() {
    this.carregarTotalMedicosCard();
    this.consultarPacientes();
    this.buscarConsultasHoje();
    this.buscarConsultasMes();

    this.carregarMedicosAtivosSelect();
    this.buscarListaConsultasDoDia();
    this.buscarQuantidadeConsultasPorMedicoMes();

    this.formFiltroConsultas.get('idMedico')?.valueChanges.subscribe(() => {
      this.buscarListaConsultasDoDia();
    });
  }

  // =======================
  // CARDS
  // =======================

  carregarTotalMedicosCard() {
    this.http.get(`${environment.api.medicos}/ativos`).subscribe({
      next: (response: any) => this.totalMedicos.set(response.length),
      error: (e: any) => this.mensagemMedicos.set(e.error?.message || 'erro ao consultar médicos.')
    });
  }

  private readonly endPointPacientes = `${environment.api.pacientes}?nome=&page=0&size=1`;

  consultarPacientes() {
    this.http.get(this.endPointPacientes).subscribe({
      next: (response: any) => this.totalPacientes.set(response.totalElements),
      error: (e: any) => this.mensagemPacientes.set(e.error?.message || 'erro ao consultar pacientes.')
    });
  }

  private endpointBaseConsultasHoje = `${environment.api.consultas}/datas`;

  buscarConsultasHoje() {
    const url = `${this.endpointBaseConsultasHoje}/${this.dataHoje}/${this.dataHoje}?page=0&size=1`;
    this.http.get(url).subscribe({
      next: (response: any) => this.totalConsultasHoje.set(response.totalElements),
      error: (e: any) => this.mensagemConsultasHoje.set((e.error?.message ? e.error.message + ' para hoje.' : '') || 'erro ao consultar dados das consultas diárias.')
    });
  }

  private endpointBaseConsultasMes = `${environment.api.consultas}/datas`;

  buscarConsultasMes() {
    const url = `${this.endpointBaseConsultasMes}/${this.primeiroDia}/${this.ultimoDia}?page=0&size=1`;
    this.http.get(url).subscribe({
      next: (response: any) => this.totalConsultasMes.set(response.totalElements),
      error: (e: any) => this.mensagemConsultasMes.set((e.error?.message ? e.error.message + ' para este mês.' : '') || 'erro ao consultar dados das consultas mensais.')
    });
  }

  // =======================
  // SELECT MÉDICOS
  // =======================
  carregarMedicosAtivosSelect() {
    this.http.get(`${environment.api.medicos}/ativos`).subscribe({
      next: (response: any) => this.medicos.set(response || []),      
      error: () => this.medicos.set([])
    });
  }

  // =======================
  // LISTA CONSULTAS DO DIA
  // =======================
  buscarListaConsultasDoDia() {
    const idMedico = this.formFiltroConsultas.get('idMedico')?.value;
    const dataInicio = this.dataHoje;
    const dataFim = this.dataHoje;

    const urlData = `${environment.api.consultas}/datas/${dataInicio}/${dataFim}?page=0&size=50`;
    const urlDataMedico = `${environment.api.consultas}/medico?idMedico=${idMedico}&dataInicio=${dataInicio}&dataFim=${dataFim}`;

    const url = (idMedico === '' || idMedico == null) ? urlData : urlDataMedico;

    this.http.get(url).subscribe({
      next: (response: any) => this.consultasHoje.set(response.content || response || []),
      error: () => this.consultasHoje.set([])
    });
  }

  // =======================
  // RESUMO DO GRÁFICO
  // =======================
  buscarQuantidadeConsultasPorMedicoMes() {
    const endpoint = `${environment.api.consultas}/medicos/resumo/${this.primeiroDia}/${this.ultimoDia}`;

    this.http.get(endpoint).subscribe({
      next: (response: any) => {
        const lista = (response?.content ?? response ?? []) as ResumoConsultasPorMedico[];
        this.quantidadeConsultasPorMedicoMes.set(Array.isArray(lista) ? lista : []);
      },
      error: () => this.quantidadeConsultasPorMedicoMes.set([])
    });
  }

  // =======================
  // FUNÇÕES PURAS DO GRÁFICO
  // =======================
  private buildChartData(resumo: ResumoConsultasPorMedico[]) {
    return {
      categories: resumo.map(r => r.nomeMedico ?? 'Sem nome'),
      data: resumo.map(r => Number(r.quantidadeConsultas ?? 0)),
    };
  }

  private buildChartOptions(categories: string[], data: number[]): Highcharts.Options {
    return {
      chart: { type: 'bar'}, // barra horizontal
      title: { text: 'Consultas por médico (mês)' },
      xAxis: { categories, title: { text: null } },
      yAxis: {
        min: 0,
        title: { text: 'Quantidade', align: 'high' },
        labels: { enabled: false },
      },
      tooltip: { valueSuffix: ' consultas' },
      plotOptions: { bar: { dataLabels: { enabled: true } } },
      legend: { enabled: false },
      credits: { enabled: false },
      series: [{ type: 'bar', name: 'Consultas', data, color: '#1f1f1f'}],
    };
  }
}
