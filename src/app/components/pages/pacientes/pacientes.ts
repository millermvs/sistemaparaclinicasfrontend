// pacientes.ts

import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask({ dropSpecialCharacters: false })],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  pacientes = signal<any[]>([]);
  pacientesFound = signal<any[]>([]);
  ativarBodyPesquisa = signal<boolean>(false);

  mensagemPagPrincipal = signal<string>('');
  mensagemModal = signal<string>('');
  tipoMensagem = signal<string>('');

  paginaAtual = signal<number>(0);
  totalPaginas = signal<number>(0);
  tamanhoPagina = 10;

  pacienteSelecionado: any = null;
  idClinica = 1;

  @ViewChild('btnCloseAdd') btnCloseAdd!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnCloseEdit') btnCloseEdit!: ElementRef<HTMLButtonElement>;

  ngOnInit() {
    this.consultarPacientes(this.paginaAtual());
  }

  baseUrl = `${environment.api.clinicas}/${this.idClinica}`;

  consultarPacientes(page: number) {
    this.http.get(`${this.baseUrl}/pacientes?page=${page}&size=${this.tamanhoPagina}`)
      .subscribe({
        next: (response: any) => {
          this.ativarBodyPesquisa.set(false);
          this.formPesquisar.get('nome')?.setValue('');
          this.pacientes.set(response.content);
          this.paginaAtual.set(response.number);
          this.totalPaginas.set(response.totalPages);
        },
        error: (e: any) => {
          this.mensagemPagPrincipal.set(e.error.type);
          this.tipoMensagem.set('danger');
        }
      });
  }

  totalPaginasArray() { 
    return Array.from({ length: this.totalPaginas() }, (_, index) => index); 
  }
  irParaPagina(page: number) {
    if (page < 0 || page >= this.totalPaginas()) 
      return;
    this.consultarPacientes(page);
  }

  aplicarCPF(c: string) { return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); }
  formatarTel(t: string) {
    const n = t.startsWith('55') ? t.slice(2) : t;
    return n.length == 10 ? n.replace(/(\d{2})(\d{4})(\d{4})/, '($1)$2-$3')
      : n.replace(/(\d{2})(\d{5})(\d{4})/, '($1)$2-$3');
  }
  limparCPF(c: string) { return c.replace(/\D/g, ''); }
  limparTel(t: string) { return '55' + t.replace(/\D/g, ''); }

  formPesquisar = this.fb.group({
    nome: ['', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ\\s]{1,100}$')]]
  });

  pesquisarPorNome() {
    if (this.formPesquisar.invalid) { 
      this.consultarPacientes(0); 
      return; 
    }
    this.http.get(`${environment.api.pacientes}?nome=${this.formPesquisar.value.nome}`)
      .subscribe({
        next: (response: any) => {
          this.pacientesFound.set(response.content); 
          this.ativarBodyPesquisa.set(true); 
        },
        error: (e: any) => { 
          this.tipoMensagem.set('danger'); 
          this.mensagemPagPrincipal.set(e.error.message);
          setTimeout(() => this.mensagemPagPrincipal.set(''), 4000);
          this.consultarPacientes(0);
        }
      });
  }

  formAdd = this.fb.group({
    nome: ['', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ\\s]{1,100}$')]],
    cpf: ['', [Validators.required, Validators.pattern('^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$')]],
    telefone: ['', [Validators.required, Validators.pattern('^\\(\\d{2}\\)\\d{4,5}-\\d{4}$')]],
    email: ['', [Validators.required, Validators.email]]
  });

  addPaciente() {
    if (this.formAdd.invalid) {
      this.formAdd.markAllAsTouched();
      return;
    }
    const payload = {
      idClinica: this.idClinica,
      nomePaciente: this.formAdd.value.nome,
      cpfPaciente: this.limparCPF(this.formAdd.value.cpf || ''),
      whatsAppPaciente: this.limparTel(this.formAdd.value.telefone || ''),
    };

    console.log(payload)
    this.http.post(`${environment.api.pacientes}/cadastrar`, payload)
      .subscribe({
        next: (response: any) => {
          this.tipoMensagem.set('success');
          this.mensagemPagPrincipal.set(response.resposta);
          this.formAdd.reset();
          this.consultarPacientes(this.paginaAtual());
          this.btnCloseAdd.nativeElement.click();
          setTimeout(() => this.mensagemPagPrincipal.set(''), 4000);
        },
        error: (e) => {
          this.tipoMensagem.set('danger');
          this.mensagemModal.set(e.error.message);
          setTimeout(() => this.mensagemModal.set(''), 4000);
        }
      });
  }

  formEdit = this.fb.group({
    id: [''],
    nome: ['', [Validators.required]],
    cpf: ['', [Validators.required]],
    telefone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  abrirEditar(p: any) {
    this.formEdit.patchValue({
      id: p.id,
      nome: p.nome,
      cpf: this.aplicarCPF(p.cpf),
      telefone: this.formatarTel(p.telefone),
      email: p.email
    });
  }

  editarPaciente() {
    if (this.formEdit.invalid) { this.formEdit.markAllAsTouched(); return; }
    const id = this.formEdit.value.id;
    const payload = {
      nome: this.formEdit.value.nome?.trim(),
      cpf: this.limparCPF(this.formEdit.value.cpf || ''),
      telefone: this.limparTel(this.formEdit.value.telefone || ''),
      email: this.formEdit.value.email
    };
    this.http.put(`${environment.api.pacientes}/editar/${id}`, payload)
      .subscribe({
        next: (r: any) => {
          this.tipoMensagem.set('success');
          this.mensagemPagPrincipal.set(r.resposta);
          this.consultarPacientes(this.paginaAtual());
          this.btnCloseEdit.nativeElement.click();
          setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
        },
        error: (e) => { this.tipoMensagem.set('danger'); this.mensagemModal.set(e.error.message); }
      });
  }

  abrirExcluir(p: any) { this.pacienteSelecionado = p; }
  deletarPaciente() {
    this.http.delete(`${environment.api.pacientes}/deletar/${this.pacienteSelecionado.id}`)
      .subscribe({
        next: () => {
          this.consultarPacientes(this.paginaAtual());
          this.mensagemPagPrincipal.set("Paciente inativado com sucesso.");
          setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
        }
      });
  }
}
