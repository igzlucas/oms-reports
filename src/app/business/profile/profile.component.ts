import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { EncryptService } from '../../core/services/encrypt.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export default class ProfileComponent {
  datos: any; 
  name: string = '';
  correo: string = '';
  rol: string = '';
  isLoading = true


  constructor(private authService: AuthService, private encryptService: EncryptService) { }
  

  async ngOnInit(): Promise<void> {

    setTimeout(async() => {
    this.datos = (await this.authService.getUserName()) ;
    this.name =  this.encryptService.descifrarRsa(this.datos.name.toString())|| 'Invitado';
    this.correo = this.encryptService.descifrarRsa(this.datos.correo.toString()) || 'null';
    this.rol = this.encryptService.descifrarRsa(this.datos.rol.toString()) || 'null';
    this.isLoading = false;
    }, 500);
    
    
  }

  ChangePassword(){
    
  }

}
