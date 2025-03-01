import { ConfigService } from '../../../core/services/config.service';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-configuraciones',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.css']
})
export default class ConfiguracionesComponent implements OnInit {
  configId: any;
  configData: any = {};
  isLoading = true;

  constructor(
    private configService: ConfigService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    setTimeout(() => {
      this.route.paramMap.subscribe((params) => {
        this.configId = params.get('configId'); 
          this.loadConfigData(); 
      });
    }, 500);

    
  }

  loadConfigData(): void {
    this.configService.getConfigById(this.configId).subscribe(
      (data) => {
        this.configData = data;
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        console.error('Error al obtener los datos de configuración', error);
      }
    );
  }

  onSubmit(): void {
    console.log('Formulario enviado', this.configData);
  }
}
