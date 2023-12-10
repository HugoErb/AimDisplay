import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


/**********************  Pages ***********************/
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { CreationComponent } from './creation/creation.component';
import { ModificationComponent } from './modification/modification.component';
import { DisplayComponent } from './display/display.component';
import { ManageAccountComponent } from './manage-account/manage-account.component';
import { SettingsComponent } from './settings/settings.component';
import { ConsultationComponent } from './consultation/consultation.component';


/**********************  PrimeNG ***********************/
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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
    AppRoutingModule,
    TableModule,
    PaginatorModule,
    InputSwitchModule,
    InputNumberModule,
    DropdownModule,
    BrowserAnimationsModule,
    InputTextModule,
    CascadeSelectModule,
    AutoCompleteModule,
    CalendarModule,
    ChartModule,
    ConfirmDialogModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
