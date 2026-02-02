import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  imports: [CommonModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {

  private http = inject(HttpClient);

  conversas = signal<any[]>([]);
  mensagens = signal<any[]>([]);
  mobileView = signal<'list' | 'chat'>('list');
  conversaSelecionada = signal<any | null>(null);


  ngOnInit() {
    this.listarConversas();
  }

  abrirConversa(conversa: any) {
    this.conversaSelecionada.set(conversa);
    console.log(conversa)
    this.carregarMensagens(conversa)
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

  carregarMensagens(conversa: any){

    this.http.get(environment.api.listarMensagens + `?idconversa=${conversa.idConversa}`).subscribe({
      next: (response: any) => {
        this.mensagens.set(response.content)
        console.log(this.mensagens());
      },
      error: (e: any) => {
        console.log("erro ao carregar mensagens: " + e);
      }
    })

    
    
  }
}
