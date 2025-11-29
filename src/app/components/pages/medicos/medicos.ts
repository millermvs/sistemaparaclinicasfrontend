import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';


@Component({
  selector: 'app-medicos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask({ dropSpecialCharacters: false })],
  templateUrl: './medicos.html',
  styleUrl: './medicos.css',
})
export class Medicos{

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  mensagem = signal<string>('');
  tipoMensagem = signal<string>('');
  paginaAtual = signal<number>(0);        // página começa em 0 (Spring padrão)
  totalPaginas = signal<number>(0);       // vem do backend
  medicos = signal<any[]>([]);
  readonly tamanhoPagina = 10; 

  ngOnInit(){
    this.consultarMedicos(this.paginaAtual());
  }

  private readonly baseUrl = 'http://localhost:8080/api/v1/clinicas/1/medicos';  

  consultarMedicos(page: number){    
    let endpointConsultar = this.baseUrl + "?page=" + page + "&size=" + this.tamanhoPagina;
    this.http.get(endpointConsultar).subscribe({
      next: (response: any)=>{
        this.medicos.set(response.content);
        // atualiza controles de paginação
        this.paginaAtual.set(response.number);
        this.totalPaginas.set(response.totalPages);

        console.log('Médicos na página:', this.medicos());
        console.log('Página atual:', this.paginaAtual(), 'Total páginas:', this.totalPaginas());
      },
      error: (e)=>{
        console.log(e.error);
      }
    })
  } 
  irParaPagina(page: number): void {
    // guarda de segurança: não deixa ir pra página inválida
    if (page < 0 || page >= this.totalPaginas()) {
      return;
    }

    this.consultarMedicos(page);
  } 

  totalPaginasArray(): number[] {
    // gera [0, 1, 2, ..., totalPaginas-1]
    return Array.from({ length: this.totalPaginas() }, (_, index) => index);
  }

  formAddMedico = this.fb.group({
    nomeMedico: [
      '',
      [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ\\s]{1,100}$')]
    ],

    cpfMedico: [
      '',
      [Validators.required, Validators.pattern('^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$')]
    ],

    crmMedico: [
      '',
      [Validators.required, Validators.pattern('^[0-9A-Za-z]{4,20}$')]
    ],

    whatsAppMedico: [
      '',
      [Validators.required, Validators.pattern('^\\(\\d{2}\\)\\d{4,5}-\\d{4}$')]
    ]
  });
  

  capitalizarNome() {
    const ctrl = this.formAddMedico.get('nomeMedico');
    let valor: string = ctrl?.value || '';

    // vê se o usuário acabou de digitar um espaço
    const terminaComEspaco = valor.endsWith(' ');

    // tira espaços extras do fim e deixa tudo minúsculo
    valor = valor.trimEnd().toLowerCase();

    if (!valor) {
      // se ficou vazio, só mantém um espaço se ele digitou espaço
      ctrl?.setValue(terminaComEspaco ? ' ' : '', { emitEvent: false });
      return;
    }

    // divide por QUALQUER quantidade de espaço e já normaliza pra um só
    const palavras = valor
      .split(/\s+/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1));

    let resultado = palavras.join(' ');

    // se o usuário digitou um espaço no final, mantém UM espaço
    if (terminaComEspaco) {
      resultado += ' ';
    }

    ctrl?.setValue(resultado, { emitEvent: false });
  }

  private removeMascaraCPF(cpf: string): string {
    return cpf.replace(/\D/g, ''); // remove tudo que não é número
  }

  private converteWhatsApp(whats: string): string {
    const apenasNumeros = whats.replace(/\D/g, ''); // ex: "21965250053"

    return '55' + apenasNumeros;
  }

  private prepararPayload() {
    const raw = this.formAddMedico.value;

    return {
      idClinica: 1,
      nomeMedico: raw.nomeMedico?.trimEnd(),
      cpfMedico: this.removeMascaraCPF(raw.cpfMedico ?? ''),
      crmMedico: raw.crmMedico?.toUpperCase(),
      whatsAppMedico: this.converteWhatsApp(raw.whatsAppMedico ?? '')
    };
  }

  addMedico() {
    if (this.formAddMedico.invalid) {
      this.formAddMedico.markAllAsTouched();
      return;
    }

    const medico = this.prepararPayload();

    const endpointCadastrar = "http://localhost:8080/api/v1/medicos/cadastrar";

    this.http.post(endpointCadastrar, medico).subscribe({
      next: (response: any) => {
        this.tipoMensagem.set("success");
        this.mensagem.set(response.resposta);
        this.formAddMedico.reset();
        this.consultarMedicos(this.paginaAtual());
        setTimeout(() => {
              this.mensagem.set('');
            }, 5000);
      },
      error: (e: any) => {
        this.tipoMensagem.set("danger")
        this.mensagem.set(e.error.message);
        setTimeout(() => {
              this.mensagem.set('');;
            }, 5000);
      }
    })   
  }
}
