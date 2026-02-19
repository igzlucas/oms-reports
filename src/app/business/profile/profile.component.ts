import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa, CuentaBancaria } from '../../core/models/empresa.model';
import { ToastService } from '../../core/services/toast.service';
import { User } from 'firebase/auth';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  user: User | null = null;
  displayName: string = '';
  
  empresa: Empresa = {
    id: '',
    nombre: '',
    direccion: '',
    telefonos: [],
    correo: '',
    logoUrl: '',
    cuentasBancarias: []
  };

  newTelefono = '';
  newCuenta: CuentaBancaria = { banco: '', numero: '' };
  
  isNewEmpresa = true; 
  activeTab: 'profile' | 'empresa' = 'profile';

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private empresaService: EmpresaService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.authService.user$.subscribe((user: User | null) => {
      if (user) {
        this.user = user;
        this.displayName = user.displayName || '';
        this.loadEmpresaData();
      }
    });
  }

  switchTab(tab: 'profile' | 'empresa'): void {
    this.activeTab = tab;
  }

  loadEmpresaData(): void {
    this.empresaService.getEmpresa().subscribe(empresa => {
      if (empresa) {
        this.empresa = {
          ...empresa,
          telefonos: empresa.telefonos || [],
          cuentasBancarias: empresa.cuentasBancarias || []
        };
        this.isNewEmpresa = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.empresa.logoUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSave(): Promise<void> {
    // --- Profile & Password --- //
    if (this.activeTab === 'profile') {
      if (this.user && this.displayName !== this.user.displayName) {
        try {
          await this.authService.updateProfile({ displayName: this.displayName });
          this.toastService.show('¡Nombre de usuario actualizado!', 'success');
        } catch (error) {
          this.toastService.show('Error al actualizar el nombre de usuario.', 'error');
        }
      }

      if (this.passwordData.currentPassword && this.passwordData.newPassword) {
        if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
          this.toastService.show('La nueva contraseña y la confirmación no coinciden.', 'error');
          return;
        }
        try {
          await this.updateUserPassword();
          this.toastService.show('¡Contraseña actualizada con éxito!', 'success');
          this.resetPasswordForm();
        } catch (error) {
          this.toastService.show('Error al actualizar la contraseña.', 'error');
        }
      }
    }

    // --- Company Data --- //
    if (this.activeTab === 'empresa' && this.user) {
      if (this.isNewEmpresa) {
        const { id, ...empresaData } = this.empresa;
        this.empresaService.createEmpresa(empresaData).subscribe(docRef => {
          if (docRef && docRef.id) {
            this.empresa.id = docRef.id;
            this.isNewEmpresa = false;
            this.empresaService.assignEmpresaToUser(this.user!.uid, docRef.id).subscribe(() => {
              this.updateEmpresaData();
            });
          }
        });
      } else {
        this.updateEmpresaData();
      }
    }
  }
  
  updateEmpresaData(): void {
      if (this.empresa.id) { // ¡CORREGIDO!
        this.empresaService.updateEmpresa(this.empresa.id, this.empresa).subscribe(() => {
            this.toastService.show('¡Información de la empresa guardada!', 'success');
        }, () => {
            this.toastService.show('Error al guardar la información de la empresa.', 'error');
        });
      }
  }

  async updateUserPassword(): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Usuario no válido.');

    const credential = EmailAuthProvider.credential(user.email, this.passwordData.currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, this.passwordData.newPassword);
  }

  // --- Dynamic lists management ---
  addTelefono(): void {
    if (this.newTelefono.trim()) {
      this.empresa.telefonos.push(this.newTelefono.trim());
      this.newTelefono = '';
    }
  }

  removeTelefono(index: number): void {
    this.empresa.telefonos.splice(index, 1);
  }

  addCuenta(): void {
    if (this.newCuenta.banco.trim() && this.newCuenta.numero.trim()) {
      this.empresa.cuentasBancarias.push({ ...this.newCuenta });
      this.newCuenta = { banco: '', numero: '' };
    }
  }

  removeCuenta(index: number): void {
    this.empresa.cuentasBancarias.splice(index, 1);
  }

  onCancel(): void {
    this.loadEmpresaData();
    this.resetPasswordForm();
    if (this.user) {
      this.displayName = this.user.displayName || '';
    }
    this.toastService.show('Cambios cancelados', 'info');
  }

  private resetPasswordForm(): void {
    this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }
}
