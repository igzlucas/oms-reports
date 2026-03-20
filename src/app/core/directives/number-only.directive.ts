import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appNumberOnly]',
  standalone: true
})
export class NumberOnlyDirective {

  constructor(private el: ElementRef) { }

  @HostListener('input', ['$event'])
  onInputChange(event: Event): void {
    const initialValue = this.el.nativeElement.value;
    // Replace any non-numeric characters
    let newValue = initialValue.replace(/[^0-9]*/g, '');
    // Limit to 10 digits
    if (newValue.length > 10) {
      newValue = newValue.substring(0, 10);
    }
    this.el.nativeElement.value = newValue;
    if (initialValue !== this.el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}
