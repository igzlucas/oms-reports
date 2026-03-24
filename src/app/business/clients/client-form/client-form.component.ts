
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ClientService } from '../../../core/services/client.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { Client, Equipment } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css']
})
export class ClientFormComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private empresaService = inject(EmpresaService);

  clientForm: FormGroup;
  isEditMode = false;
  clientId: string | null = null;
  private subscriptions = new Subscription();

  constructor() {
    this.clientForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', Validators.email],
      telefono: ['', [Validators.pattern('^[0-9]*$')]],
      direccion: ['', Validators.required],
      equipos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.clientId;

    if (this.isEditMode && this.clientId) {
      const clientSub = this.clientService.getClientById(this.clientId).pipe(take(1)).subscribe(client => {
        if (client) {
          const formData = {
            ...client,
            telefono: client.phone, 
            direccion: client.address 
          };
          this.clientForm.patchValue(formData);
          if (client.equipos) {
            this.equipos.clear();
            client.equipos.forEach(equipo => this.addEquipo(equipo));
          }
        }
      });
      this.subscriptions.add(clientSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get equipos(): FormArray {
    return this.clientForm.get('equipos') as FormArray;
  }

  // SOLUCIÓN FINAL AL PROBLEMA DE 'customerId'
  // Esta función ahora SOLO crea un control para 'nombre'.
  addEquipo(equipo?: Equipment): void {
    this.equipos.push(this.fb.group({
      nombre: [equipo?.nombre || '', Validators.required]
    }));
  }

  removeEquipo(index: number): void {
    this.equipos.removeAt(index);
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const empresaSub = this.empresaService.getEmpresa().pipe(take(1)).subscribe(empresa => {
      if (!empresa || !empresa.id) {
        console.error("Error Crítico: No se pudo obtener la empresa. El cliente no puede ser guardado.");
        return;
      }

      const formValue = this.clientForm.getRawValue();

      const clientData = {
        empresaId: empresa.id,
        nombre: formValue.nombre,
        email: formValue.email,
        phone: formValue.telefono,
        address: formValue.direccion,
        equipos: formValue.equipos || []
      };

      if (this.isEditMode && this.clientId) {
        this.clientService.updateClient(this.clientId, clientData).pipe(take(1)).subscribe({
          next: () => this.router.navigate(['/clients']),
          error: (err) => console.error('Error al actualizar el cliente:', err)
        });
      } else {
        this.clientService.addClient(clientData).pipe(take(1)).subscribe({
          next: () => this.router.navigate(['/clients']),
          error: (err) => console.error('Error al añadir el cliente:', err)
        });
      }
    });

    this.subscriptions.add(empresaSub);
  }
}
