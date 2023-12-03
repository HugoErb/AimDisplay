import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { CreationComponent } from './creation/creation.component';
import { ModificationComponent } from './modification/modification.component';
import { DisplayComponent } from './display/display.component';
import { ManageAccountComponent } from './manage-account/manage-account.component';
import { SettingsComponent } from './settings/settings.component';
import { ConsultationComponent } from './consultation/consultation.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreationComponent,
    ModificationComponent,
    DisplayComponent,
    ManageAccountComponent,
    SettingsComponent,
    ConsultationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
