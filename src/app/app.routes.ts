import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreationComponent } from './creation/creation.component';
import { ModificationComponent } from './modification/modification.component';
import { ConsultationComponent } from './consultation/consultation.component';
import { DisplayComponent } from './display/display.component';
import { SettingsComponent } from './settings/settings.component';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: '',
        component: BaseLayoutComponent,
        children: [
            {
                path: 'home',
                component: HomeComponent,
            },
            {
                path: 'creation',
                component: CreationComponent,
            },
            {
                path: 'modification',
                component: ModificationComponent,
            },
            {
                path: 'consultation',
                component: ConsultationComponent,
            },
            {
                path: 'display',
                component: DisplayComponent,
            },
            {
                path: 'settings',
                component: SettingsComponent,
            },
        ],
    },
];
