import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { HomeComponent } from './home/home.component';
import { CreationShooterComponent } from './creation_shooter/creation_shooter.component';
import { CreationCompetitionComponent } from './creation_competition/creation_competition.component';
import { CreationClubComponent } from './creation_club/creation_club.component';
import { ModificationShooterComponent } from './modification_shooter/modification_shooter.component';
import { ModificationCompetitionComponent } from './modification_competition/modification_competition.component';
import { ModificationClubComponent } from './modification_club/modification_club.component';
import { RankingComponent } from './ranking/ranking.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DisplayComponent } from './display/display.component';
import { SettingsComponent } from './settings/settings.component';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';
import { GenererPDFComponent } from './generer_pdf/generer_pdf.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const routes: Routes = [
  // On envoie la racine vers la page de login (pas vers home)
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Pages accessibles sans être connecté
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Tout le reste est protégé
  {
    path: '',
    component: BaseLayoutComponent,
    canActivateChild: [AuthGuard], // protège tous les enfants ci-dessous
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'ranking', component: RankingComponent },
      { path: 'creation_shooter', component: CreationShooterComponent },
      { path: 'creation_competition', component: CreationCompetitionComponent },
      { path: 'creation_club', component: CreationClubComponent },
      { path: 'modification_shooter', component: ModificationShooterComponent },
      { path: 'modification_competition', component: ModificationCompetitionComponent },
      { path: 'modification_club', component: ModificationClubComponent },
      { path: 'display', component: DisplayComponent },
      { path: 'generer_pdf', component: GenererPDFComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: 'login' },
];
