import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreationComponent } from './creation/creation.component';

const routes: Routes = [
  {
    path: "",
    component: HomeComponent
  }, {
    path: "creation",
    component: CreationComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
