import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Invoice } from '../../interfaces/common.interfaces';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finances.component.html',
  styleUrl: './finances.component.scss'
})
export class FinancesComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  searchTerm: string = '';
  clinicFilter: string = '';
  startDate: string = '';
  endDate: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getInvoices().subscribe(invoices => {
      this.invoices = invoices;
      this.filteredInvoices = invoices;
    });
  }

  filterInvoices() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesSearch = invoice.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           invoice.clinic.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesClinic = !this.clinicFilter || invoice.clinic === this.clinicFilter;
      
      // Date range filtering - convert DD/MM/YYYY input to Date objects
      let matchesDateRange = true;
      if (this.startDate || this.endDate) {
        const invoiceDate = new Date(invoice.dateIssued);
        
        if (this.startDate) {
          const startDateObj = this.convertDDMMYYYYToDate(this.startDate);
          if (startDateObj) {
            matchesDateRange = matchesDateRange && invoiceDate >= startDateObj;
          }
        }
        
        if (this.endDate) {
          const endDateObj = this.convertDDMMYYYYToDate(this.endDate);
          if (endDateObj) {
            // Set end date to end of day for inclusive filtering
            endDateObj.setHours(23, 59, 59, 999);
            matchesDateRange = matchesDateRange && invoiceDate <= endDateObj;
          }
        }
      }
      
      return matchesSearch && matchesClinic && matchesDateRange;
    });
  }

  getUniqueClinics(): string[] {
    return [...new Set(this.invoices.map(invoice => invoice.clinic))].sort();
  }

  // Format date from YYYY-MM-DD to DD/MM/YYYY
  formatDateToEuropean(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Convert DD/MM/YYYY string to Date object
  convertDDMMYYYYToDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    // Handle both DD/MM/YYYY and YYYY-MM-DD formats
    if (dateString.includes('/')) {
      // DD/MM/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    } else if (dateString.includes('-')) {
      // YYYY-MM-DD format (from date input)
      return new Date(dateString);
    }
    
    return null;
  }

  // Convert Date object to DD/MM/YYYY string for input fields
  formatDateForInput(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle date input change - convert from browser format to DD/MM/YYYY
  onStartDateChange(event: any) {
    const value = event.target.value;
    if (value) {
      // Browser date input gives YYYY-MM-DD, convert to DD/MM/YYYY for display
      const date = new Date(value);
      this.startDate = this.formatDateForInput(date);
    } else {
      this.startDate = '';
    }
    this.filterInvoices();
  }

  onEndDateChange(event: any) {
    const value = event.target.value;
    if (value) {
      // Browser date input gives YYYY-MM-DD, convert to DD/MM/YYYY for display
      const date = new Date(value);
      this.endDate = this.formatDateForInput(date);
    } else {
      this.endDate = '';
    }
    this.filterInvoices();
  }

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input value
  getDateInputValue(ddmmyyyyString: string): string {
    if (!ddmmyyyyString) return '';
    
    const date = this.convertDDMMYYYYToDate(ddmmyyyyString);
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  }

  clearDateFilters() {
    this.startDate = '';
    this.endDate = '';
    this.filterInvoices();
  }
}