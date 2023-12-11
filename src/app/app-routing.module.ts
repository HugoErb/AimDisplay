import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreationComponent } from './creation/creation.component';
import { ModificationComponent } from './modification/modification.component';
import { ConsultationComponent } from './consultation/consultation.component';
import { DisplayComponent } from './display/display.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
  {
    path: "",
    component: HomeComponent
  },
  {
    path: "creation",
    component: CreationComponent
  },
  {
    path: "modification",
    component: ModificationComponent
  },
  {
    path: "consultation",
    component: ConsultationComponent
  },
  {
    path: "display",
    component: DisplayComponent
  },
  {
    path: "settings",
    component: SettingsComponent
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
