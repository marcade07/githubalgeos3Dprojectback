import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { User } from '../../interfaces/common.interfaces';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  customers: User[] = [];
  filteredCustomers: User[] = [];
  searchTerm: string = '';
  roleFilter: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getCustomers().subscribe((customers: User[]) => {
      this.customers = customers;
      this.filteredCustomers = this.customers;
    });
  }

  filterCustomers() {
    this.filteredCustomers = this.customers.filter(customer => {
      const matchesSearch = customer.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           customer.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           customer.organization.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRole = !this.roleFilter || customer.role === this.roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }

  getUniqueRoles(): string[] {
    return [...new Set(this.customers.map(customer => customer.role))].sort();
  }

  // Action methods - placeholder implementations
  viewCustomer(customer: User): void {
    console.log('View customer:', customer);
    alert(`Viewing customer: ${customer.firstName} ${customer.lastName} from ${customer.organization}`);
  }

  editCustomer(customer: User): void {
    console.log('Edit customer:', customer);
    alert(`Editing customer: ${customer.firstName} ${customer.lastName}`);
  }

  deleteCustomer(customer: User): void {
    if (confirm(`Are you sure you want to delete customer ${customer.firstName} ${customer.lastName}?`)) {
      console.log('Delete customer:', customer);
      // Remove from filtered list for demo purposes
      this.filteredCustomers = this.filteredCustomers.filter(c => c.id !== customer.id);
      this.customers = this.customers.filter(c => c.id !== customer.id);
      alert(`Customer ${customer.firstName} ${customer.lastName} has been deleted.`);
    }
  }
}