import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Carrier, DeliveryOption } from '../../interfaces/common.interfaces';

@Component({
  selector: 'app-carriers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carriers.component.html',
  styleUrl: './carriers.component.scss'
})
export class CarriersComponent implements OnInit {
  activeTab: 'carriers' | 'delivery-options' = 'carriers';
  
  // Carriers data
  carriers: Carrier[] = [];
  filteredCarriers: Carrier[] = [];
  carriersSearchTerm: string = '';
  
  // Delivery Options data
  deliveryOptions: DeliveryOption[] = [];
  filteredDeliveryOptions: DeliveryOption[] = [];
  deliveryOptionsSearchTerm: string = '';
  carrierFilter: string | null = null;
  statusFilter: string | null = null;
  
  // Modal properties
  showDeliveryOptionModal: boolean = false;
  isEditMode: boolean = false;
  selectedDeliveryOption: DeliveryOption | null = null;
  modalData: Partial<DeliveryOption> = {};

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load carriers
    this.dataService.getCarriers().subscribe(carriers => {
      this.carriers = carriers;
      this.filteredCarriers = carriers;
      this.updateCarrierDeliveryOptionCounts();
    });

    // Load delivery options
    this.dataService.getDeliveryOptions().subscribe(options => {
      this.deliveryOptions = options;
      this.filteredDeliveryOptions = options;
      this.updateCarrierDeliveryOptionCounts();
    });
  }

  // Update delivery option counts for carriers
  updateCarrierDeliveryOptionCounts() {
    this.carriers.forEach(carrier => {
      carrier.deliveryOptionsCount = this.deliveryOptions.filter(option => option.carrierId === carrier.id).length;
    });
    this.filteredCarriers = [...this.carriers];
  }

  // Tab management
  setActiveTab(tab: 'carriers' | 'delivery-options') {
    this.activeTab = tab;
  }

  // Carriers filtering
  filterCarriers() {
    this.filteredCarriers = this.carriers.filter(carrier => {
      const matchesSearch = carrier.name.toLowerCase().includes(this.carriersSearchTerm.toLowerCase()) ||
                           carrier.trackingUrl.toLowerCase().includes(this.carriersSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  // Delivery options filtering
  filterDeliveryOptions() {
    this.filteredDeliveryOptions = this.deliveryOptions.filter(option => {
      const carrierName = this.getCarrierName(option.carrierId);
      
      const matchesSearch = option.deliveryTypeName.toLowerCase().includes(this.deliveryOptionsSearchTerm.toLowerCase()) ||
                           carrierName.toLowerCase().includes(this.deliveryOptionsSearchTerm.toLowerCase()) ||
                           option.geographicZone.toLowerCase().includes(this.deliveryOptionsSearchTerm.toLowerCase());
      
      const matchesCarrier = !this.carrierFilter || carrierName === this.carrierFilter;
      const matchesStatus = !this.statusFilter || option.status === this.statusFilter;
      
      return matchesSearch && matchesCarrier && matchesStatus;
    });
  }

  // Helper method to get carrier name by ID
  getCarrierName(carrierId: number): string {
    const carrier = this.carriers.find(c => c.id === carrierId);
    return carrier ? carrier.name : '';
  }

  // Carrier actions
  editCarrier(carrier: Carrier): void {
    console.log('Edit carrier:', carrier.name);
    alert(`Edit Carrier feature for "${carrier.name}" will be implemented later.`);
  }

  deleteCarrier(carrier: Carrier): void {
    if (confirm(`Are you sure you want to delete carrier "${carrier.name}"?`)) {
      // Check if carrier has delivery options
      const hasDeliveryOptions = this.deliveryOptions.some(option => option.carrierId === carrier.id);
      
      if (hasDeliveryOptions) {
        alert(`Cannot delete "${carrier.name}" because it has associated delivery options. Please delete all delivery options first.`);
        return;
      }
      
      // Remove from main array
      this.carriers = this.carriers.filter(c => c.id !== carrier.id);
      this.filterCarriers();
      
      console.log('Delete carrier:', carrier.name);
      alert(`Carrier "${carrier.name}" has been deleted.`);
    }
  }

  // Open add delivery option modal
  openAddDeliveryOptionModal(): void {
    this.isEditMode = false;
    this.selectedDeliveryOption = null;
    this.modalData = {
      carrierId: undefined,
      deliveryTypeName: '',
      estimatedDeliveryTime: '1',
      price: 0,
      geographicZone: '',
      status: 'Activated'
    };
    this.showDeliveryOptionModal = true;
  }

  // Edit delivery option
  editDeliveryOption(option: DeliveryOption): void {
    this.isEditMode = true;
    this.selectedDeliveryOption = option;
    
    // Extract numeric value from string for editing
    const numericValue = this.extractNumericFromString(option.estimatedDeliveryTime);
    this.modalData = { 
      ...option,
      estimatedDeliveryTime: String(numericValue)
    };
    this.showDeliveryOptionModal = true;
  }

  // Close delivery option modal
  closeDeliveryOptionModal(): void {
    this.showDeliveryOptionModal = false;
    this.isEditMode = false;
    this.selectedDeliveryOption = null;
    this.modalData = {};
  }

  // Form validation
  isFormValid(): boolean {
    return !!(
      this.modalData.carrierId &&
      String(this.modalData.deliveryTypeName ?? '').trim() !== '' &&
      String(this.modalData.estimatedDeliveryTime ?? '').trim() !== '' &&
      parseInt(String(this.modalData.estimatedDeliveryTime ?? ''), 10) > 0 &&
      this.modalData.price !== undefined &&
      this.modalData.price !== null &&
      this.modalData.price >= 0 &&
      String(this.modalData.geographicZone ?? '').trim() !== '' &&
      this.modalData.status
    );
  }

  // Save delivery option
  saveDeliveryOption(): void {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields.');
      return;
    }

    // Convert numeric input to string format for storage
    const numericDays = parseInt(String(this.modalData.estimatedDeliveryTime ?? ''), 10);
    const estimatedDeliveryTimeString = numericDays === 1 ? '1 day' : `${numericDays} days`;

    if (this.isEditMode && this.selectedDeliveryOption) {
      // Update existing delivery option
      const index = this.deliveryOptions.findIndex(o => o.id === this.selectedDeliveryOption!.id);
      if (index !== -1) {
        this.deliveryOptions[index] = {
          ...this.deliveryOptions[index],
          carrierId: this.modalData.carrierId!,
          deliveryTypeName: String(this.modalData.deliveryTypeName ?? '').trim(),
          estimatedDeliveryTime: estimatedDeliveryTimeString,
          price: this.modalData.price!,
          geographicZone: String(this.modalData.geographicZone ?? '').trim(),
          status: this.modalData.status as 'Activated' | 'Deactivated'
        };
        
        console.log('Updated delivery option:', this.deliveryOptions[index]);
        alert(`Delivery option "${String(this.modalData.deliveryTypeName ?? '').trim()}" has been updated successfully!`);
      }
    } else {
      // Add new delivery option
      const newOption: DeliveryOption = {
        id: Math.max(...this.deliveryOptions.map(o => o.id), 0) + 1,
        carrierId: this.modalData.carrierId!,
        deliveryTypeName: String(this.modalData.deliveryTypeName ?? '').trim(),
        estimatedDeliveryTime: estimatedDeliveryTimeString,
        price: this.modalData.price!,
        geographicZone: String(this.modalData.geographicZone ?? '').trim(),
        status: this.modalData.status as 'Activated' | 'Deactivated'
      };
      
      this.deliveryOptions.push(newOption);
      console.log('Added new delivery option:', newOption);
      alert(`Delivery option "${String(this.modalData.deliveryTypeName ?? '').trim()}" has been added successfully!`);
    }

    // Update carrier delivery option counts and refresh filters
    this.updateCarrierDeliveryOptionCounts();
    this.filterDeliveryOptions();
    this.closeDeliveryOptionModal();
  }

  // Delete delivery option
  deleteDeliveryOption(option: DeliveryOption): void {
    const carrierName = this.getCarrierName(option.carrierId);
    
    if (confirm(`Are you sure you want to delete delivery option "${option.deliveryTypeName}" for ${carrierName}?`)) {
      // Remove from main array
      this.deliveryOptions = this.deliveryOptions.filter(o => o.id !== option.id);
      this.filterDeliveryOptions();
      this.updateCarrierDeliveryOptionCounts();
      
      console.log('Delete delivery option:', option.deliveryTypeName);
      alert(`Delivery option "${option.deliveryTypeName}" has been deleted.`);
    }
  }

  // Helper method to get unique carrier names for filter dropdown
  getUniqueCarrierNames(): string[] {
    return [...new Set(this.carriers.map(carrier => carrier.name))].sort();
  }

  // Helper method to extract numeric value from estimatedDeliveryTime string
  private extractNumericFromString(estimatedDeliveryTime: string): number {
    const timeString = String(estimatedDeliveryTime ?? '');
    if (!timeString.trim()) return 1;
    
    // If it's already a number string, return it
    const numericValue = parseInt(timeString, 10);
    if (!isNaN(numericValue)) {
      return numericValue;
    }
    
    // Extract number from formatted strings like "2 days" or "1 day"
    const match = timeString.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }
}