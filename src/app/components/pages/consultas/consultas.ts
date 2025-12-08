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
  ngOnInit() {
  this.gerarHorariosDisponiveis();
  this.buscarMedicosModal();
}

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  horariosDisponiveis: string[] = [];
  idClinica = 1;
  hoje = new Date().toISOString().split('T')[0];
  mensagemPagPrincipal = signal<string>('');
  mensagemModal = signal<string>('');
  tipoMensagem = signal<string>('');

  @ViewChild('btnCloseSalvar') btnCloseSalvar!: ElementRef<HTMLButtonElement>;  

  // Lista de medicos retornada pela busca ao iniciar a página
  medicosModal = signal<any[]>([]);

  // Lista de pacientes retornada pela busca da modal
  pacientesModal = signal<any[]>([]);

  // Form principal da consulta (ligado na modal)
  formCadastroConsulta = this.fb.group({
    idMedico: ['', [Validators.required]],
    idPaciente: ['', [Validators.required]],
    dataConsulta: ['', [Validators.required]],
    horaConsulta: ['', [Validators.required]],
    //tipoConsulta: ['']
  });

  // Form só para buscar paciente pelo nome
  formBuscarPacienteModal = this.fb.group({
    nomePaciente: ['', [Validators.required]]
  });
  
  limparModal() {
  this.formCadastroConsulta.reset();
  this.formBuscarPacienteModal.reset();
  this.pacientesModal.set([]);  // limpa lista de pacientes
}

gerarHorariosDisponiveis() {
  const lista: string[] = [];

  // exemplo: das 08:00 até 18:45
  for (let hora = 8; hora <= 18; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 15) {
      const h = hora.toString().padStart(2, '0');   // 08, 09, 10...
      const m = minuto.toString().padStart(2, '0'); // 00, 15, 30, 45
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
    return cpf.replace(/\D/g, ''); // remove tudo que não é número
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////Buscar medicos na modal///////////////////////////////////////////////

  buscarMedicosModal() {

    this.http.get(`${environment.api.medicos}/ativos`)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          this.medicosModal.set(response || []);
        },
        error: (e) => {
          console.log(e);
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

    this.http.get(`${environment.api.pacientes}?nome=${nome}`)
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
  endpointSalvar = `${environment.api.consultas}/agendar`
  salvarConsulta() {
    //if (this.formCadastroConsulta.invalid) {
    //  this.formCadastroConsulta.markAllAsTouched();
    //  return;
    //}

    const payload = {
      //idClinica: this.idClinica,
      idMedico: this.formCadastroConsulta.value.idMedico,
      idPaciente: this.formCadastroConsulta.value.idPaciente,
      dataConsulta: this.formCadastroConsulta.value.dataConsulta,
      horaConsulta: this.formCadastroConsulta.value.horaConsulta,
      //tipoConsulta: this.formCadastroConsulta.value.tipoConsulta
    };

    console.log('Payload consulta:', payload);

    
    this.http.post(this.endpointSalvar, payload)
       .subscribe({
         next: (response: any) => { 
          console.log(response);
          this.tipoMensagem.set('success');
          this.mensagemPagPrincipal.set(response.resposta);
          this.btnCloseSalvar.nativeElement.click();
          setTimeout(() => this.mensagemPagPrincipal.set(''), 4000);
          },
         error: (e: any) => { 
          console.log(e.error.message)
          this.tipoMensagem.set('danger');
          this.mensagemModal.set(e.error.message);
          setTimeout(() => this.mensagemModal.set(''), 4000);
          }
       });
  }
}