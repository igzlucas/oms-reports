import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsComponent } from './reports.component';
import { ReportsRoutingModule } from './reports-routing.module';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular'; // Importa el token

@NgModule({
  declarations: [
    ReportsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReportsRoutingModule,
    EditorModule
  ],
  providers: [
    // ¡LA SOLUCIÓN FINAL Y DEFINITIVA!
    // Esto le dice al editor que cargue el script principal desde la carpeta local,
    // forzando a que todos los demás archivos (plugins, temas, etc.) también se carguen desde ahí,
    // evitando así la necesidad de una API Key.
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }
  ]
})
export class ReportsModule { }
