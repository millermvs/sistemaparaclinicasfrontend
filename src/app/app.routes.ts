import { Routes } from '@angular/router';
import { Dashboard } from './components/pages/dashboard/dashboard';
import { Medicos } from './components/pages/medicos/medicos';
import { Pacientes } from './components/pages/pacientes/pacientes';
import { Consultas } from './components/pages/consultas/consultas';

export const routes: Routes = [
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
        path : '', pathMatch : 'full', redirectTo : 'pages/dashboard'
    }
];
