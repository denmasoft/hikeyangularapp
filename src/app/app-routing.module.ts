import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
const routes: Routes = [      {
  path: 'check-repo-stability', loadChildren: '@main/main.module#MainModule',
},
{path: '', redirectTo: '/check-repo-stability', pathMatch: 'full'}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
