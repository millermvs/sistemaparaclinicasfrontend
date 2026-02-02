import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private pollingId: any = null;


  conversas = signal<any[]>([]);
  mensagens = signal<any[]>([]);
  mobileView = signal<'list' | 'chat'>('list');
  conversaSelecionada = signal<any | null>(null);

  formEnviarMsgTexto = this.fb.group({
    idConversa: [''],
    destinatario: [''],
    tipo: ['TEXTO'],
    body: ['', [Validators.required]]
  })


  ngOnInit() {
    this.listarConversas();
  }

  //Parar polling
  ngOnDestroy() {
    this.pararPolling();
  }

  private iniciarPolling() {
    this.pararPolling(); // garante que não duplica

    this.pollingId = setInterval(() => {
      const conversa = this.conversaSelecionada();
      if (conversa) {
        this.carregarMensagens(conversa);
      }
    }, 3000); // "a cada 3s, busca as mensagens dessa conversa"
  }


  private pararPolling() {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }
  }


  abrirConversa(conversa: any) {
    this.conversaSelecionada.set(conversa);
    this.carregarMensagens(conversa);
    this.iniciarPolling();
    // Só muda a view no mobile. No desktop, pode ficar como está.
    if (window.innerWidth <= 920) {
      this.mobileView.set('chat');
    }
  }

  voltarParaLista() {
    this.mobileView.set('list');
  }


  listarConversas() {
    this.http.get(environment.api.listarConversas).subscribe({
      next: (response: any) => {
        this.conversas.set(response.content);
      },
      error: (e: any) => {
        console.log(e)
      }
    })
  }

  carregarMensagens(conversa: any) {

    this.http.get(environment.api.listarMensagens + `?idconversa=${conversa.idConversa}`).subscribe({
      next: (response: any) => {
        this.mensagens.set(response.content)
      },
      error: (e: any) => {
        console.log("erro ao carregar mensagens: " + e);
      }
    })
  }

  enviarMensagemTexto(conversa: any) {
    this.formEnviarMsgTexto.patchValue({
      idConversa: conversa.idConversa,
      destinatario: conversa.waId,
      tipo: "TEXTO"
    });
    this.http.post(environment.api.enviarMsgTexto, this.formEnviarMsgTexto.value).subscribe({
      next: (response: any) => {
        console.log(response)
        this.carregarMensagens(conversa);
        this.formEnviarMsgTexto.get('body')?.reset();
      },
      error: (e: any) => {
        console.log(e.error)
      }
    });
  }
}
