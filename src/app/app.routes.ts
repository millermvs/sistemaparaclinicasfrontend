import { Routes } from '@angular/router';
import { Dashboard } from './components/pages/dashboard/dashboard';
import { Medicos } from './components/pages/medicos/medicos';
import { Pacientes } from './components/pages/pacientes/pacientes';
import { Consultas } from './components/pages/consultas/consultas';
import { Login } from './components/pages/login/login';
import { Chat } from './components/pages/chat/chat';

export const routes: Routes = [
    {
        path : 'pages/login',
        component : Login
    },
    {
        path : 'pages/dashboard',
        component : Dashboard
    },
    {
        path : 'pages/medicos',
        component : Medicos
    },
    {
        path : 'pages/pacientes',
        component : Pacientes
    },
    {
        path : 'pages/consultas',
        component : Consultas
    },
    {
        path : 'pages/chat',
        component : Chat
    },
    {
        path : '', pathMatch : 'full', redirectTo : 'pages/login'
    }
];
