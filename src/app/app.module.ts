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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreationComponent,
    ModificationComponent,
    DisplayComponent,
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
    ConfirmDialogModule,
    InputTextareaModule
  ],
  providers: [ConfirmationService, MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
