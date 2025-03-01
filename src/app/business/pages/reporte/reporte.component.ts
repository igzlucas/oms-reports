import { Component,  ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { environment } from '../../../../environments/environment';
import { EncryptService } from '../../../core/services/encrypt.service';
import { CustomersService, CustomerRequest } from '../../../core/services/customers.service'




@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css'],
})




export default class ReporteComponent implements AfterViewInit  {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;
  isModalOpen = false;
  isModalOpenCreate = false;
  loading = false;
  private canvasContext!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private eventListeners: { element: HTMLElement; type: string; listener: EventListener }[] = [];


      currentCustomer: CustomerRequest = {
        empresaId: '',
        nombre: '',
        direccion: ''
      };


  reportData = {
    userId: environment.users.id,
    clienteId: '',
    fecha: '',
    persona: '',
    equipo: '',
    cliente: '',
    direccion: '',
    problema: '',
    trabajo: '',
    monto: '0',
    moneda: 'MXN',
    observaciones: '',
    detalles: [{ cantidad: '1', descripcion: '', precio: '0', total: '' }],
    firma:'',
  };


  
  customers: any[] = [];
  errors: any = {};

  alertVisible = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'warning' | 'info' = 'info';


  constructor(private reportService: ReportService, private customerService: CustomersService, private encryptService: EncryptService) {
  }



  ngAfterViewInit() {
    this.loadCustomers();
  }

  ngOnDestroy() {
    this.removeAllEventListeners();
  }

  private addEventListenerWithTracking(element: HTMLElement, type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) {
    element.addEventListener(type, listener, options);
    this.eventListeners.push({ element, type, listener });
  }

  private removeAllEventListeners() {
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
    this.eventListeners = [];
  }


  initializeCanvas() {
    this.removeAllEventListeners();
    const canvas = this.signatureCanvas.nativeElement;
    
   
    this.canvasContext = canvas.getContext('2d')!;

    
    const container = canvas.parentElement;
    if (container) {
      canvas.width = parseInt(getComputedStyle(container).getPropertyValue('width'));
      canvas.height = parseInt(getComputedStyle(container).getPropertyValue('height'));
    }

    // Configure context
    this.canvasContext.strokeStyle = '#000';
    this.canvasContext.lineWidth = 2;
    this.canvasContext.lineJoin = 'round';
    this.canvasContext.lineCap = 'round';

    // Touch Events
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches && e.touches[0]) {
        this.isDrawing = true;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        this.lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        this.lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(this.lastX, this.lastY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!this.isDrawing) return;
      
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const newX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const newY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(this.lastX, this.lastY);
        this.canvasContext.lineTo(newX, newY);
        this.canvasContext.stroke();
        
        this.lastX = newX;
        this.lastY = newY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      this.isDrawing = false;
      this.canvasContext.closePath();
    };

    // Mouse Events
    const handleMouseDown = (e: MouseEvent) => {
      this.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      this.lastX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.lastY = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(this.lastX, this.lastY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const newX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const newY = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(this.lastX, this.lastY);
      this.canvasContext.lineTo(newX, newY);
      this.canvasContext.stroke();
      
      this.lastX = newX;
      this.lastY = newY;
    };

    const handleMouseUp = () => {
      this.isDrawing = false;
      this.canvasContext.closePath();
    };

    // Add touch events
    this.addEventListenerWithTracking(canvas, 'touchstart', handleTouchStart as EventListener, { passive: false });
    this.addEventListenerWithTracking(canvas, 'touchmove', handleTouchMove as EventListener, { passive: false });
    this.addEventListenerWithTracking(canvas, 'touchend', handleTouchEnd as EventListener, { passive: false });
    this.addEventListenerWithTracking(canvas, 'touchcancel', handleTouchEnd as EventListener, { passive: false });

    // Add mouse events
    this.addEventListenerWithTracking(canvas, 'mousedown', handleMouseDown as EventListener);
    this.addEventListenerWithTracking(canvas, 'mousemove', handleMouseMove as EventListener);
    this.addEventListenerWithTracking(canvas, 'mouseup', handleMouseUp as EventListener);
    this.addEventListenerWithTracking(canvas, 'mouseout', handleMouseUp as EventListener);
  }

  openModal() {
    this.isModalOpen = true;
    document.body.classList.add('overflow-hidden');
    
    // Esperamos a que el DOM se actualice y el modal se muestre
    setTimeout(() => {
      if (this.signatureCanvas) {
        this.initializeCanvas();
      }
    }, 100); // Damos más tiempo para asegurar que el canvas esté disponible
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.classList.remove('overflow-hidden');
    this.removeAllEventListeners();
  }


private isValidBase64(str: string): boolean {
  try {

    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}
 
  clearCanvas() {
    const canvas = this.signatureCanvas.nativeElement;
    this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  }

  saveSignature() {
    const canvas = this.signatureCanvas.nativeElement;
    this.reportData.firma = canvas.toDataURL('image/png'); 
    this.closeModal();
  }


  removeSignature() {
    this.reportData.firma = '';
  }

  
  removeDetalle(index: number) {
    this.reportData.detalles.splice(index, 1);
    this.updateTotal(this.reportData.detalles);
  }
  
  updateTotal(detalle: any) {
    
    var total = detalle.cantidad * detalle.precio;
    detalle.total = total
    let totalMonto = 0;
    this.reportData.detalles.forEach((detalle) => {
      totalMonto +=  Number(detalle.total);
    });

    this.reportData.monto = totalMonto.toString();
    
  }


  addDetalle() {
      this.reportData.detalles.push({
        cantidad: '1',
        descripcion: '',
        precio: '0',
        total: '',
      });
  }


  formatDate(date: string): string {
    if (!date) return '';
    
    // Si la fecha ya viene en formato yyyy/MM/dd, convertirla a yyyy-MM-dd
    if (date.includes('/')) {
      const [year, month, day] = date.split('/');
      return `${year}-${month}-${day}`;
    }
    
    return date; // Si ya está en formato yyyy-MM-dd, la devolvemos tal cual
  }
  
  updateFecha(value: string): void {
    // Guardamos la fecha en formato ISO que Spring puede manejar
    this.reportData.fecha = value; // value ya viene como yyyy-MM-dd del input
  }


  showAlert(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;

    // Oculta automáticamente la alerta después de 5 segundos
    setTimeout(() => {
      this.alertVisible = false;
    }, 5000);
  }

  

  sendReport() {
    this.loading = true;
  
    if (!this.reportData.firma) {
      this.showAlert('error', 'Por favor, añade una firma antes de enviar el reporte.');
      this.loading = false;
      return;
    } 
    
    if (!this.validateForm()) {
      this.loading = false;
      return;
    }
  
    const base64String = this.reportData.firma.split(',')[1];  
    if (!this.isValidBase64(base64String)) {  
      this.showAlert('error', 'Error al guardar la firma. Por favor, intente nuevamente.');
      this.loading = false;
      return;
    }
  
    this.reportData.firma = this.encryptService.cifrarAes(base64String);
  
    // Calcular totales antes de enviar
    this.reportData.detalles.forEach((detalle) => {
      detalle.total = (
        Number(detalle.cantidad) * Number(detalle.precio)
      ).toString();
    });
  
    // Enviar reporte
    this.reportService.sendReport(this.reportData).subscribe({
      next: (response: any) => { 
        const base64Report = this.encryptService.descifrarAes(response.documento);
        if (base64Report) {
          this.openPdf(base64Report); // Decodifica y abre el PDF
        } else {
          console.error('El campo "documento" está vacío o no existe.');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al enviar el reporte', error);
        if (error.error) {
          console.error('Detalles del error:', error.error);
        }
        this.loading = false;
      }
    });
  }
  

 

  validateForm(): boolean {
    this.errors = {
      detalles: false, // Añade esta propiedad
    };
    let isValid = true;
    let invalidField = '';
    this.errors.detalles = this.reportData.detalles.length === 0;
  
    // Campos que no son requeridos en la raíz del objeto
    const nonRequiredFields: Array<keyof typeof this.reportData> = ['observaciones', 'firma'];
  
    // Campos que no son requeridos dentro de `detalles`
    const nonRequiredFieldsDetails = ['total'];
  
    // Validar cada campo requerido en la raíz del objeto
    (Object.keys(this.reportData) as Array<keyof typeof this.reportData>).forEach((key) => {
      if (!nonRequiredFields.includes(key)) {
        const value = this.reportData[key];
  
        if (typeof value === 'string' && !value.trim()) {
          this.errors[key] = true;
          isValid = false;
          invalidField = key; // Captura el último campo no válido
        }
      }
    });
  
    // Validar cada objeto dentro de `detalles`
    if (Array.isArray(this.reportData.detalles)) {
      this.reportData.detalles.forEach((detalle, index) => {
        (Object.keys(detalle) as Array<keyof typeof detalle>).forEach((key) => {
          if (!nonRequiredFieldsDetails.includes(key) && (!detalle[key] || !detalle[key]?.toString().trim())) {
            this.errors[`detalles[${index}].${key}`] = true;
            isValid = false;
            invalidField = `detalles[${index}].${key}`; // Captura el campo inválido en `detalles`
          }
        });
      });
    }
  
    if (!isValid) {
      const errorMessage = `Por favor, complete todos los campos requeridos. Campo faltante: ${invalidField}`;
      this.showAlert('error', errorMessage);
    }
  
    return isValid;
  }
  

  loadCustomers(): void {
    this.customerService.getClientes(environment.users.id).subscribe({
      next: (data) => {
        this.customers = data.resultado;
      },
      error: (err) => {
        console.error('Error al cargar los clientes:', err);
      }
    });
  }

  onCustomerChange(clienteNombre: string): void {
    const selectedCustomer = this.customers.find((c) => c.clienteNombre === clienteNombre);
    if (selectedCustomer) {
      this.reportData.clienteId = selectedCustomer.clienteId
      this.reportData.direccion = selectedCustomer.clienteDireccion;
    }
   
  }

  // Función para abrir el modal
openModalCreate(event?: Event) {
  event?.preventDefault();  // Evita que se recargue la página
  this.currentCustomer.nombre = '',
  this.currentCustomer.direccion = '',
  this.isModalOpenCreate = true;
}

closeModalCreate() {
  this.isModalOpenCreate = false;
}


  saveCustomer(){
    this.currentCustomer.empresaId = environment.bussines.id;
     // Si no tiene ID, crearlo
     if (!this.currentCustomer.nombre && !this.currentCustomer.direccion ) {
      this.showAlert('error', 'El nombre no deben de estar vacíos');
      this.closeModalCreate();
      return;
    }
     this.customerService
     .crearCliente(this.currentCustomer)
     .subscribe(response => {
      this.showAlert('success', 'Clientes creado exitosamente : ' + response.nombre);   
       this.closeModalCreate();
       this.loadCustomers();
     }, error => {
      this.showAlert('error', error.error.detalles);
      this.closeModalCreate();
      return;
     });
    
  }




  /**
   * Método para abrir el archivo PDF decodificando el Base64
   * @param base64String Base64 del reporte PDF
   */
  private openPdf(base64String: string) {
    // Decodificar Base64 a binario
    const binary = atob(base64String);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    const file = new Blob([new Uint8Array(array)], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL); // O descarga: location.href = fileURL;
  }


  

 
}
