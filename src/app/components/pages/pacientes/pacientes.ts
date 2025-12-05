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

  capitalizarNome(valor: string): string {

    if (!valor) return '';

    // Vê se o usuário colocou espaço no final
    const terminaComEspaco = valor.endsWith(' ');

    // Normaliza texto
    valor = valor.trimEnd().toLowerCase();

    // Divide palavras (um ou vários espaços)
    const palavras = valor
      .split(/\s+/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1));

    let resultado = palavras.join(' ');

    // mantém o espaço no final se o usuário digitou
    if (terminaComEspaco) {
      resultado += ' ';
    }
    return resultado;
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

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////WhatsApp//////////////////////////////////////
  public aplicarMascaraWhats(whats: string): string {
    // remove o 55
    const numero = whats.startsWith('55') ? whats.slice(2) : whats;

    if (numero.length === 10) {
      // ex: 2196525005 → (21)9652-5005
      return numero.replace(/(\d{2})(\d{4})(\d{4})/,
        '($1)$2-$3');
    }

    // ex: 21965250053 → (21)96525-0053
    return numero.replace(/(\d{2})(\d{5})(\d{4})/,
      '($1)$2-$3');
  }

  private converteWhatsApp(whats: string): string {
    const apenasNumeros = whats.replace(/\D/g, ''); // ex: "21965250053"

    return '55' + apenasNumeros;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////FormilarioPesquisar/MetodosPesquisar//////////////////////////////////////
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

  ///////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////FormilariosADD/MetodosADD//////////////////////////////////////
  formAdd = this.fb.group({
    nome: ['', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ\\s]{1,100}$')]],
    cpf: ['', [Validators.required, Validators.pattern('^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$')]],
    whatsApp: ['', [Validators.required, Validators.pattern('^\\(\\d{2}\\)\\d{4,5}-\\d{4}$')]]
  });

  addPaciente() {
    if (this.formAdd.invalid) {
      this.formAdd.markAllAsTouched();
      return;
    }
    const payload = {
      idClinica: this.idClinica,
      nomePaciente: this.formAdd.value.nome?.trim(),
      cpfPaciente: this.removeMascaraCPF(this.formAdd.value.cpf || ''),
      whatsAppPaciente: this.converteWhatsApp(this.formAdd.value.whatsApp || ''),
    };

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

  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////FormilariosEdit/MetodosEdit//////////////////////////////////////
  formEdit = this.fb.group({
    id: [''],
    nome: ['', [Validators.required]],
    cpf: ['', [Validators.required]],
    whatsApp: ['', [Validators.required]],
  });

  abrirEditar(paciente: any) {
    this.formEdit.patchValue({
      id: paciente.idPaciente,
      nome: paciente.nomePaciente,
      cpf: this.aplicarMascaraCPF(paciente.cpfPaciente),
      whatsApp: this.aplicarMascaraWhats(paciente.whatsAppPaciente),
    });
  }

  editarPaciente() {
    if (this.formEdit.invalid) { 
      this.formEdit.markAllAsTouched(); 
      return; 
    }
    const id = this.formEdit.value.id;
    const payload = {
      idPaciente: id,
      nomePaciente: this.formEdit.value.nome?.trim(),
      cpfPaciente: this.removeMascaraCPF(this.formEdit.value.cpf || ''),
      whatsAppPaciente: this.converteWhatsApp(this.formEdit.value.whatsApp || '')
    };
    console.log(payload);
    this.http.put(`${environment.api.pacientes}/editar/${id}`, payload)
      .subscribe({
        next: (r: any) => {
          this.tipoMensagem.set('success');
          this.mensagemPagPrincipal.set(r.resposta);
          this.consultarPacientes(this.paginaAtual());
          this.btnCloseEdit.nativeElement.click();
          setTimeout(() => this.mensagemPagPrincipal.set(''), 3000);
        },
        error: (e: any) => { 
          this.tipoMensagem.set('danger'); 
          this.mensagemModal.set(e.error.message);
          setTimeout(() => this.mensagemModal.set(''), 4000);
        }
      });
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////MetodoDelete//////////////////////////////////////////
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
