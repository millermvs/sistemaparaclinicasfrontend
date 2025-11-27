import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

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
      nomeMedico: raw.nomeMedico,
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
    console.log("Enviando pro backend:", medico);

    // exemplo da request:
    //this.http.post('/api/medicos', medico).subscribe(...)
  }
}
