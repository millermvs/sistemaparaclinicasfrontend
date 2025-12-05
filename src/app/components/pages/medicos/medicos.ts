import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ViewChild, ElementRef } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-medicos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask({ dropSpecialCharacters: false })],
  templateUrl: './medicos.html',
  styleUrl: './medicos.css',
})
export class Medicos {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  idClinica: number = 1;
  mensagemPagPrincipal = signal<string>('');
  mensagemModal = signal<string>('');
  tipoMensagem = signal<string>('');
  paginaAtual = signal<number>(0);        // página começa em 0 (Spring padrão)
  totalPaginas = signal<number>(0);       // vem do backend
  medicos = signal<any[]>([]);
  medicosFounds = signal<any[]>([]);
  ativarBodyPesquisa = signal<boolean>(false);
  readonly tamanhoPagina = 10;
  @ViewChild('btnCloseAddModal')     // fechar modal
  btnCloseAddModal!: ElementRef<HTMLButtonElement>; // fechar modal
  @ViewChild('btnCloseEditModal')     // fechar modal
  btnCloseEditModal!: ElementRef<HTMLButtonElement>; // fechar modal

  ngOnInit() {
    this.consultarMedicos(this.paginaAtual());
  }

  private readonly baseUrl = `${environment.api.clinicas}`;

  consultarMedicos(page: number) {    
    let endpointConsultar = `${this.baseUrl}/${this.idClinica}/medicos?page=${page}&size=${this.tamanhoPagina}`;
    this.http.get(endpointConsultar).subscribe({
      next: (response: any) => {
        this.ativarBodyPesquisa.set(false);
        this.formPesquisarMedico.get('nomeMedico')?.setValue('');
        this.medicos.set(response.content);

        // atualiza controles de paginação
        this.paginaAtual.set(response.number);
        this.totalPaginas.set(response.totalPages);
      },
      error: (e: any) => {
        console.log(e.error);
        this.mensagemPagPrincipal.set(e.error.errors);
      }
    })
  }
  irParaPagina(page: number): void {
    // não deixa ir pra página inválida
    if (page < 0 || page >= this.totalPaginas()) {
      return;
    }
    this.consultarMedicos(page);
  }

  totalPaginasArray(): number[] {
    // gera [0, 1, 2, ..., totalPaginas-1]
    return Array.from({ length: this.totalPaginas() }, (_, index) => index);
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
  formPesquisarMedico = this.fb.group({
    nomeMedico: [
      '', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ\\s]{1,100}$')]
    ]
  });

  pesquisarPorNome() {
    let nome = this.formPesquisarMedico.value.nomeMedico;
    let endpoint = `${environment.api.medicos}?nome=${nome}`;

    if (this.formPesquisarMedico.invalid) {
      this.consultarMedicos(0);
      return;
    }

    this.http.get(endpoint).subscribe({
      next: (response: any) => {
        this.medicosFounds.set(response);
        this.ativarBodyPesquisa.set(true);
        this.mensagemPagPrincipal.set('')

      },
      error: (e: any) => {
        this.medicosFounds.set([]);
        this.mensagemPagPrincipal.set(e.error.message);
        this.ativarBodyPesquisa.set(true);
        this.tipoMensagem.set("danger");
      }
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////FormilariosADD/MetodosADD//////////////////////////////////////
  formAddMedico = this.fb.group({
    nomeMedico: [
      '', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ\\s]{1,100}$')]
    ],

    cpfMedico: [
      '', [Validators.required, Validators.pattern('^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$')]
    ],

    crmMedico: [
      '', [Validators.required, Validators.pattern('^[0-9A-Za-z]{4,20}$')]
    ],

    whatsAppMedico: [
      '', [Validators.required, Validators.pattern('^\\(\\d{2}\\)\\d{4,5}-\\d{4}$')]
    ]
  });

  addMedico() {
    if (this.formAddMedico.invalid) {
      this.formAddMedico.markAllAsTouched();
      return;
    }

    const payload = {
      idClinica: this.idClinica,
      nomeMedico: this.formAddMedico.value.nomeMedico,
      cpfMedico: this.removeMascaraCPF(this.formAddMedico.value.cpfMedico ?? ''),
      crmMedico: this.formAddMedico.value.crmMedico?.toUpperCase(),
      whatsAppMedico: this.converteWhatsApp(this.formAddMedico.value.whatsAppMedico ?? '')

    }

    const endpoint = `${environment.api.medicos}/cadastrar`;

    this.http.post(endpoint, payload).subscribe({
      next: (response: any) => {
        this.tipoMensagem.set("success");
        this.mensagemPagPrincipal.set(response.resposta);
        this.formAddMedico.reset();
        this.consultarMedicos(this.paginaAtual());
        this.btnCloseAddModal.nativeElement.click();
        setTimeout(() => {
          this.mensagemPagPrincipal.set('');
        }, 5000);
      },
      error: (e: any) => {
        this.tipoMensagem.set("danger")
        this.mensagemModal.set(e.error.message);
        setTimeout(() => {
          this.mensagemModal.set('');;
        }, 5000);
      }
    })
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////FormilariosEdit/MetodosEdit//////////////////////////////////////
  formEditMedico = this.fb.group({
    idMedico: [
      ''
    ],
    nomeMedico: [
      '', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ\\s]{1,100}$')]
    ],

    cpfMedico: [
      '', [Validators.required, Validators.pattern('^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$')]
    ],

    crmMedico: [
      '', [Validators.required, Validators.pattern('^[0-9A-Za-z]{4,20}$')]
    ],

    whatsAppMedico: [
      '', [Validators.required, Validators.pattern('^\\(\\d{2}\\)\\d{4,5}-\\d{4}$')]
    ]
  });

  abrirModalEditar(medico: any) {
    this.formEditMedico.patchValue({
      idMedico: medico.idMedico,
      nomeMedico: medico.nomeMedico,
      cpfMedico: this.aplicarMascaraCPF(medico.cpfMedico),   // volto a máscara
      crmMedico: medico.crmMedico,
      whatsAppMedico: this.aplicarMascaraWhats(medico.whatsAppMedico)
    });
  }

  editarMedico() {
    if (this.formEditMedico.invalid) {
      this.formEditMedico.markAllAsTouched();
      return;
    }

    const payload = {
      nomeMedico: this.formEditMedico.value.nomeMedico?.trim(),
      cpfMedico: this.removeMascaraCPF(this.formEditMedico.value.cpfMedico || ''),
      crmMedico: this.formEditMedico.value.crmMedico?.toUpperCase(),
      whatsAppMedico: this.converteWhatsApp(this.formEditMedico.value.whatsAppMedico || ''),
    };

    let endpoint = `${environment.api.medicos}/editar/${this.formEditMedico.value.idMedico}`;

    this.http.put(endpoint, payload).subscribe({
      next: (response: any) => {
        this.mensagemPagPrincipal.set(response.resposta);
        this.tipoMensagem.set('success');
        this.consultarMedicos(this.paginaAtual());
        this.btnCloseEditModal.nativeElement.click();
        setTimeout(() => {
          this.mensagemPagPrincipal.set('');
        }, 3000);
      },
      error: (e: any) => {
        this.mensagemModal.set(e.error.message);
        this.tipoMensagem.set('danger');
        setTimeout(() => {
          this.mensagemModal.set('');
        }, 3000);
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////MetodoDelete//////////////////////////////////////////
  medicoSelecionadoParaDelete: any = null;

  abrirModalConfirmarDelete(medico: any) {
    this.medicoSelecionadoParaDelete = medico;
  }

  deletarMedico() {
    if (!this.medicoSelecionadoParaDelete) {
      return;
    }
    console.log(this.medicoSelecionadoParaDelete);

    const idMedico = this.medicoSelecionadoParaDelete.idMedico;

    let endpoint = `${environment.api.medicos}/deletar/${idMedico}`;

    this.http.delete(endpoint).subscribe({
      next: (response: any) => {
        console.log(response);
        this.consultarMedicos(this.paginaAtual());
        this.tipoMensagem.set('success');
        this.mensagemPagPrincipal.set('Médico deletado com sucesso.');
        this.medicoSelecionadoParaDelete = null;
        setTimeout(() => {
          this.mensagemPagPrincipal.set('');
        }, 3000);
      },
      error: (e: any) => {
        this.mensagemPagPrincipal.set(e.error.message);
      }
    });
  }
}
