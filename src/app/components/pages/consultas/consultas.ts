import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './consultas.html',
  styleUrl: './consultas.css'
})
export class Consultas {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  // Lista de consultas da página atual
  consultas = signal<any[]>([]);

  // Paginação (padrão Pacientes e médicos)
  paginaAtual = signal<number>(0);
  totalPaginas = signal<number>(0);
  tamanhoPagina = 10;

  // Mensagens
  mensagemPagPrincipal = signal<string>('');
  mensagemModal = signal<string>('');
  tipoMensagem = signal<string>('');

  horariosDisponiveis: string[] = [];
  idClinica = 1;
  hoje = new Date();
  dataHoje = `${this.hoje.getFullYear()}-${String(this.hoje.getMonth() + 1).padStart(2, '0')}-${String(this.hoje.getDate()).padStart(2, '0')}`;


  @ViewChild('btnCloseSalvar') btnCloseSalvar!: ElementRef<HTMLButtonElement>;

  ngOnInit() {
    this.formBuscarConsultasPorDatas.get('dataInicio')?.setValue(this.dataHoje);
    this.formBuscarConsultasPorDatas.get('dataFim')?.setValue(this.dataHoje);
    this.gerarHorariosDisponiveis();
    this.buscarMedicosModal();
    this.buscarConsultas(this.paginaAtual());    
  }

  // Lista de medicos retornada pela busca ao iniciar a página
  medicosModal = signal<any[]>([]);

  // Lista de pacientes retornada pela busca da modal
  pacientesModal = signal<any[]>([]);

  // Form só para buscar pelo intervalo de datas
  formBuscarConsultasPorDatas = this.fb.group({
    idMedico: [''],
    dataInicio: ['', [Validators.required]],
    dataFim: ['', [Validators.required]]
  });

  // Form principal da consulta (ligado na modal)
  formCadastroConsulta = this.fb.group({
    idMedico: ['', [Validators.required]],
    idPaciente: ['', [Validators.required]],
    dataConsulta: ['', [Validators.required]],
    horaConsulta: ['', [Validators.required]],
  });

  // Form só para buscar paciente pelo nome
  formBuscarPacienteModal = this.fb.group({
    nomePaciente: ['', [Validators.required]]
  });

  limparModal() {
    this.formCadastroConsulta.reset();
    this.formBuscarPacienteModal.reset();
    this.pacientesModal.set([]);
  }

  gerarHorariosDisponiveis() {
    const lista: string[] = [];
    for (let hora = 8; hora <= 18; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 15) {
        const h = hora.toString().padStart(2, '0');
        const m = minuto.toString().padStart(2, '0');
        lista.push(`${h}:${m}`);
      }
    }
    this.horariosDisponiveis = lista;
  }

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////CPF///////////////////////////////////////////
  public aplicarMascaraCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4');
  }

  private removeMascaraCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////Buscar consultas na pagina principal/////////////////////////////////////////

  private endpointBaseConsultas = `${environment.api.consultas}/datas`;

  buscarConsultas(page: number) {// Datas padrão só pra teste inicial (depois podemos ligar com o filtro)
    const dataInicio = this.formBuscarConsultasPorDatas.get('dataInicio')?.value;
    const dataFim = this.formBuscarConsultasPorDatas.get('dataFim')?.value;;
    const url = `${this.endpointBaseConsultas}/${dataInicio}/${dataFim}?page=${page}&size=${this.tamanhoPagina}`;

    this.http.get(url)
      .subscribe({
        next: (response: any) => {
          this.consultas.set(response.content || []);
          this.paginaAtual.set(response.number ?? 0);
          this.totalPaginas.set(response.totalPages ?? 0);
        },
        error: (e: any) => {
          this.tipoMensagem.set('danger');
          this.mensagemPagPrincipal.set(e.error?.message || 'Erro ao buscar consultas.');
          this.consultas.set([]);
        }
      });
  }

  totalPaginasArray() {
    return Array.from({ length: this.totalPaginas() }, (_, index) => index);
  }

  irParaPagina(page: number) {
    if (page < 0 || page >= this.totalPaginas()) {
      return;
    }
    this.buscarConsultas(page);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////Buscar medicos na modal///////////////////////////////////////////////

  buscarMedicosModal() {
    this.http.get(`${environment.api.medicos}/ativos`)
      .subscribe({
        next: (response: any) => {
          this.medicosModal.set(response || []);
        },
        error: (e) => {
          this.medicosModal.set([]);
        }
      });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////Buscar pacientes na modal///////////////////////////////////////////////

  buscarPacientesModal() {
    if (this.formBuscarPacienteModal.invalid) {
      return;
    }

    const nome = this.formBuscarPacienteModal.value.nomePaciente?.trim();
    if (!nome) {
      return;
    }

    this.http.get(`${environment.api.pacientes}?nome=${nome}&size=20`)
      .subscribe({
        next: (response: any) => {
          this.pacientesModal.set(response.content || []);
        },
        error: () => {
          this.pacientesModal.set([]);
        }
      });
  }

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////Salvar consulta////////////////////////////////
  endpointSalvar = `${environment.api.consultas}/agendar`;

  salvarConsulta() {
    const payload = {
      idMedico: this.formCadastroConsulta.value.idMedico,
      idPaciente: this.formCadastroConsulta.value.idPaciente,
      dataConsulta: this.formCadastroConsulta.value.dataConsulta,
      horaConsulta: this.formCadastroConsulta.value.horaConsulta,
    };

    this.http.post(this.endpointSalvar, payload)
      .subscribe({
        next: (response: any) => {
          this.tipoMensagem.set('success');
          this.mensagemPagPrincipal.set('Consulta com paciente foi marcada.');
          this.btnCloseSalvar.nativeElement.click();
          // Recarrega a página atual da paginação
          this.buscarConsultas(this.paginaAtual());
          setTimeout(() => this.mensagemPagPrincipal.set(''), 4000);
        },
        error: (e: any) => {
          this.tipoMensagem.set('danger');
          this.mensagemModal.set(e.error.message);
          setTimeout(() => this.mensagemModal.set(''), 4000);
        }
      });
  }
}
