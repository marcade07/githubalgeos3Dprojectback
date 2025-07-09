import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-data-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-export.component.html',
  styleUrl: './data-export.component.scss'
})
export class DataExportComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  exportFormat: string = 'csv';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  // Export Backoffice Users
  exportBackofficeUsers() {
    console.log('Exporting Backoffice Users...');
    this.dataService.getBackofficeUsers().subscribe(users => {
      const csvData = this.convertToCSV(users, [
        { key: 'organization', header: 'Organization' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'status', header: 'Status' }
      ]);
      this.downloadCSV(csvData, 'backoffice-users');
    });
  }

  // Export Confections
  exportConfections() {
    console.log('Exporting Confections...');
    // Get all patients first to build confections data
    this.dataService.getPatients().subscribe(patients => {
      const allConfections: any[] = [];
      
      // Process each patient to get their confections
      let processedPatients = 0;
      
      if (patients.length === 0) {
        // Handle case where there are no patients
        const csvData = this.convertToCSV([], [
          { key: 'confectionId', header: 'Confection ID' },
          { key: 'patientFirstName', header: 'Patient First Name' },
          { key: 'patientLastName', header: 'Patient Last Name' },
          { key: 'patientId', header: 'Patient ID' },
          { key: 'clinic', header: 'Clinic' },
          { key: 'date', header: 'Date Created' },
          { key: 'madeBy', header: 'Made By' },
          { key: 'status', header: 'Status' }
        ]);
        this.downloadCSV(csvData, 'confections');
        return;
      }
      
      patients.forEach(patient => {
        this.dataService.getConfectionsByPatientId(patient.id).subscribe(confections => {
          confections.forEach(confection => {
            allConfections.push({
              confectionId: confection.confectionId,
              patientFirstName: patient.firstName,
              patientLastName: patient.lastName,
              patientId: patient.patientId,
              clinic: patient.clinic,
              date: confection.date,
              madeBy: confection.madeBy,
              status: confection.status
            });
          });
          
          processedPatients++;
          
          // When all patients are processed, export the data
          if (processedPatients === patients.length) {
            const csvData = this.convertToCSV(allConfections, [
              { key: 'confectionId', header: 'Confection ID' },
              { key: 'patientFirstName', header: 'Patient First Name' },
              { key: 'patientLastName', header: 'Patient Last Name' },
              { key: 'patientId', header: 'Patient ID' },
              { key: 'clinic', header: 'Clinic' },
              { key: 'date', header: 'Date Created' },
              { key: 'madeBy', header: 'Made By' },
              { key: 'status', header: 'Status' }
            ]);
            this.downloadCSV(csvData, 'confections');
          }
        });
      });
    });
  }

  // Export Customers
  exportCustomers() {
    console.log('Exporting Customers...');
    this.dataService.getCustomers().subscribe(customers => {
      const csvData = this.convertToCSV(customers, [
        { key: 'organization', header: 'Organization' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'status', header: 'Status' },
        { key: 'confections', header: 'Number of Confections' }
      ]);
      this.downloadCSV(csvData, 'customers');
    });
  }

  // Export Orders
  exportOrders() {
    console.log('Exporting Orders...');
    this.dataService.getOrders().subscribe(orders => {
      const csvData = this.convertToCSV(orders, [
        { key: 'orderNumber', header: 'Order Number' },
        { key: 'organization', header: 'Organization' },
        { key: 'dateCreated', header: 'Date Created' },
        { key: 'status', header: 'Status' },
        { key: 'orderPrice', header: 'Order Price (£)' },
        { key: 'insoles', header: 'Number of Insoles' },
        { key: 'topCovers', header: 'Number of Top Covers' },
        { key: 'trackingNumber', header: 'Tracking Number' }
      ]);
      this.downloadCSV(csvData, 'orders');
    });
  }

  // Export Invoices
  exportInvoices() {
    console.log('Exporting Invoices...');
    this.dataService.getInvoices().subscribe(invoices => {
      const csvData = this.convertToCSV(invoices, [
        { key: 'id', header: 'Invoice ID' },
        { key: 'dateIssued', header: 'Date Issued' },
        { key: 'clinic', header: 'Clinic' },
        { key: 'numberOfOrders', header: 'Number of Orders' },
        { key: 'amount', header: 'Amount (£)' }
      ]);
      this.downloadCSV(csvData, 'invoices');
    });
  }

  // Helper method to convert data to CSV format
  private convertToCSV(data: any[], columns: { key: string, header: string }[]): string {
    if (!data || data.length === 0) {
      // Return just headers if no data
      return columns.map(col => col.header).join(',');
    }

    // Create header row
    const headers = columns.map(col => col.header).join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return columns.map(col => {
        const value = item[col.key];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [headers, ...rows].join('\n');
  }

  // Helper method to download CSV file
  private downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Successfully exported ${filename} data as CSV`);
      
      // Show success message to user
      alert(`${filename.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} data has been exported successfully!`);
    } else {
      console.error('Download not supported in this browser');
      alert('Download not supported in this browser');
    }
  }
}