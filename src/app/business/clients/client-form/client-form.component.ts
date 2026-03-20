import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ClientService } from '../../../core/services/client.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ReportService } from '../../../core/services/report.service';
import { Client, Equipment } from '../../../core/models/client.model';
import { Report } from '../../../core/models/report.model';

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
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      address: ['', Validators.required],
      equipos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.clientId;

    if (this.isEditMode && this.clientId) {
      const clientSub = this.clientService.getClientById(this.clientId).subscribe(client => {
        if (client) {
          this.clientForm.patchValue(client);
          if (client.equipos) {
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

    const empresaSub = this.empresaService.getEmpresa().subscribe(empresa => {
      if (!empresa || !empresa.id) {
        console.error("No se pudo obtener la empresa.");
        return;
      }

      const clientData = { ...this.clientForm.value, empresaId: empresa.id };

      if (this.isEditMode && this.clientId) {
        this.clientService.updateClient(this.clientId, clientData).subscribe(() => {
          this.router.navigate(['/clients']);
        });
      } else {
        this.clientService.addClient(clientData).subscribe(() => {
          this.router.navigate(['/clients']);
        });
      }
    });

    this.subscriptions.add(empresaSub);
  }
}
