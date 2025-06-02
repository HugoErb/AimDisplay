import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreationShooterComponent } from './creation_shooter/creation_shooter.component';
import { CreationCompetitionComponent } from './creation_competition/creation_competition.component';
import { CreationClubComponent } from './creation_club/creation_club.component';
import { ModificationShooterComponent } from './modification_shooter/modification_shooter.component';
import { ModificationCompetitionComponent } from './modification_competition/modification_competition.component';
import { ModificationClubComponent } from './modification_club/modification_club.component';
import { RankingComponent } from './ranking/ranking.component';
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
		path: 'ranking',
		component: RankingComponent,
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
				path: 'creation_shooter',
				component: CreationShooterComponent,
			},
			{
				path: 'creation_competition',
				component: CreationCompetitionComponent,
			},
			{
				path: 'creation_club',
				component: CreationClubComponent,
			},
			{
				path: 'modification_shooter',
				component: ModificationShooterComponent,
			},
			{
				path: 'modification_competition',
				component: ModificationCompetitionComponent,
			},
			{
				path: 'modification_club',
				component: ModificationClubComponent,
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
