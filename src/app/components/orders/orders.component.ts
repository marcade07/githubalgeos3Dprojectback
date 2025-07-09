import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Order } from '../../interfaces/common.interfaces';

// Simplified interfaces for order modal data - confection-centric only
interface OrderConfection {
  id: number;
  confectionId: string;
  patientFirstName: string;
  patientLastName: string;
  practitioner: string;
  shoeSize: string;
  status: 'Draft' | 'In Cart' | 'Ordered' | 'Received';
  products: ConfectionProduct[];
}

interface ConfectionProduct {
  id: number;
  type: 'Insole' | 'Top Cover';
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  statusFilter: string = '';
  expandedOrderId: number | null = null;
  
  // Order modal properties
  showOrderModal: boolean = false;
  selectedOrder: Order | null = null;
  
  // Prescription modal properties
  showPrescriptionModal: boolean = false;
  selectedConfection: OrderConfection | null = null;
  mockPrescriptionData: any = {
    personalInfo: {
      firstName: 'Emily',
      lastName: 'Watson',
      dateOfBirth: '1985-03-15'
    },
    medicalInfo: {
      height: '165 cm',
      weight: '62 kg',
      shoeSizeUK: '6',
      shoeSizeEU: '39',
      typeOfShoes: 'Athletic/Running',
      footWidth: 'Medium',
      footType: 'Normal',
      archType: 'Medium Arch',
      footRange: 'Normal',
      stjAxisLocation: 'Medial',
      symptomsOrDiagnosis: 'Plantar fasciitis, heel pain, mild overpronation during gait cycle',
      comments: 'Patient reports morning heel pain that improves with activity. Recommends custom orthotic with heel cup and arch support.'
    },
    associatedScans: [
      {
        scanType: '3D Foot Scan',
        date: '2024-12-10',
        foot: 'Left'
      },
      {
        scanType: '3D Foot Scan',
        date: '2024-12-10',
        foot: 'Right'
      },
      {
        scanType: 'Pressure Analysis',
        date: '2024-12-08',
        foot: 'Left'
      },
      {
        scanType: 'Pressure Analysis',
        date: '2024-12-08',
        foot: 'Right'
      }
    ]
  };

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getOrders().subscribe((orders: Order[]) => {
      this.orders = orders;
      this.filteredOrders = orders;
    });
  }

  filterOrders() {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           order.organization.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Date range filtering - convert DD/MM/YYYY input to Date objects for comparison
      let matchesDateRange = true;
      if (this.startDate || this.endDate) {
        const orderDate = new Date(order.dateCreated);
        
        if (this.startDate) {
          const startDateObj = this.convertDDMMYYYYToDate(this.startDate);
          if (startDateObj) {
            matchesDateRange = matchesDateRange && orderDate >= startDateObj;
          }
        }
        
        if (this.endDate) {
          const endDateObj = this.convertDDMMYYYYToDate(this.endDate);
          if (endDateObj) {
            // Set end date to end of day for inclusive filtering
            endDateObj.setHours(23, 59, 59, 999);
            matchesDateRange = matchesDateRange && orderDate <= endDateObj;
          }
        }
      }
      
      const matchesStatus = !this.statusFilter || order.status === this.statusFilter;
      
      return matchesSearch && matchesDateRange && matchesStatus;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.startDate = '';
    this.endDate = '';
    this.statusFilter = '';
    this.filteredOrders = this.orders;
  }

  // Date handling methods
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

  // Convert Date object to DD/MM/YYYY string for display
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
    this.filterOrders();
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
    this.filterOrders();
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

  // Clear date filters
  clearDateFilters() {
    this.startDate = '';
    this.endDate = '';
    this.filterOrders();
  }

  // Check if order is expanded
  isOrderExpanded(orderId: number): boolean {
    return this.expandedOrderId === orderId;
  }

  // Toggle order row expansion
  toggleOrderExpansion(order: Order, event?: MouseEvent): void {
    if (event) {
      const target = event.target as HTMLElement;
      const isChevronButton = target.closest('.chevron-btn');
      const isActionButton = target.closest('.action-buttons') && !isChevronButton;
      
      if (isActionButton) {
        return;
      }
    }

    if (this.expandedOrderId === order.id) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = order.id;
    }
  }

  // View order in modal
  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  // Close order modal
  closeOrderModal(): void {
    this.showOrderModal = false;
    this.selectedOrder = null;
  }

  // Get confections for an order with complete product breakdown
  getOrderConfections(orderId: number): OrderConfection[] {
    // Mock data for confections with complete product breakdown - NO SUBTOTAL PROPERTY
    const confectionsData: { [key: number]: OrderConfection[] } = {
      1: [ // ORD-2025-001 - London Podiatry Centre
        {
          id: 1,
          confectionId: 'LPC-CONF-001',
          patientFirstName: 'Emily',
          patientLastName: 'Watson',
          practitioner: 'Dr. Robert Thompson',
          shoeSize: 'UK 6 / EU 39',
          status: 'Ordered',
          products: [
            {
              id: 1,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 2,
              type: 'Top Cover',
              name: 'Leathertec Vive',
              code: 'LT-VIVE',
              quantity: 1,
              unitPrice: 12.99
            },
            {
              id: 3,
              type: 'Top Cover',
              name: 'Leathertec Performance 4000',
              code: 'LT-P4000',
              quantity: 1,
              unitPrice: 14.50
            }
          ]
        },
        {
          id: 2,
          confectionId: 'LPC-CONF-002',
          patientFirstName: 'James',
          patientLastName: 'Mitchell',
          practitioner: 'Helen Anderson',
          shoeSize: 'UK 9 / EU 43',
          status: 'Ordered',
          products: [
            {
              id: 4,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 5,
              type: 'Top Cover',
              name: 'Leathertec Performance XRD',
              code: 'LT-XRD',
              quantity: 2,
              unitPrice: 14.99
            }
          ]
        }
      ],
      2: [ // ORD-2025-002 - Manchester Foot Clinic
        {
          id: 3,
          confectionId: 'MFC-CONF-001',
          patientFirstName: 'Michael',
          patientLastName: 'Roberts',
          practitioner: 'Dr. David Wilson',
          shoeSize: 'UK 10 / EU 44',
          status: 'Ordered',
          products: [
            {
              id: 6,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 7,
              type: 'Top Cover',
              name: 'Leathertec Medical Hindfoot Zone',
              code: 'LT-HFZ',
              quantity: 1,
              unitPrice: 11.25
            },
            {
              id: 8,
              type: 'Top Cover',
              name: 'Leathertec Medical Forefoot Zone',
              code: 'LT-FFZ',
              quantity: 1,
              unitPrice: 10.75
            }
          ]
        }
      ],
      3: [ // ORD-2025-003 - Birmingham Medical Centre
        {
          id: 4,
          confectionId: 'BMC-CONF-001',
          patientFirstName: 'Rachel',
          patientLastName: 'Green',
          practitioner: 'Mark Johnson',
          shoeSize: 'UK 7 / EU 40',
          status: 'Received',
          products: [
            {
              id: 9,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 10,
              type: 'Top Cover',
              name: 'Leathertec Vive',
              code: 'LT-VIVE',
              quantity: 2,
              unitPrice: 12.99
            }
          ]
        },
        {
          id: 5,
          confectionId: 'BMC-CONF-002',
          patientFirstName: 'Thomas',
          patientLastName: 'Baker',
          practitioner: 'Claire Smith',
          shoeSize: 'UK 11 / EU 45',
          status: 'Received',
          products: [
            {
              id: 11,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 12,
              type: 'Top Cover',
              name: 'Leathertec Performance 4000',
              code: 'LT-P4000',
              quantity: 1,
              unitPrice: 14.50
            },
            {
              id: 13,
              type: 'Top Cover',
              name: 'Leathertec Performance XRD',
              code: 'LT-XRD',
              quantity: 1,
              unitPrice: 14.99
            }
          ]
        },
        {
          id: 6,
          confectionId: 'BMC-CONF-003',
          patientFirstName: 'Lisa',
          patientLastName: 'White',
          practitioner: 'Mark Johnson',
          shoeSize: 'UK 5 / EU 38',
          status: 'Received',
          products: [
            {
              id: 14,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 15,
              type: 'Top Cover',
              name: 'Leathertec Medical Hindfoot Zone',
              code: 'LT-HFZ',
              quantity: 1,
              unitPrice: 11.25
            },
            {
              id: 16,
              type: 'Top Cover',
              name: 'Leathertec Medical Forefoot Zone',
              code: 'LT-FFZ',
              quantity: 1,
              unitPrice: 10.75
            }
          ]
        }
      ],
      4: [ // ORD-2025-004 - Leeds Sports Medicine
        {
          id: 7,
          confectionId: 'LSM-CONF-001',
          patientFirstName: 'Andrew',
          patientLastName: 'Taylor',
          practitioner: 'Dr. Sophie Brown',
          shoeSize: 'UK 8 / EU 42',
          status: 'Ordered',
          products: [
            {
              id: 17,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 18,
              type: 'Top Cover',
              name: 'Leathertec Vive',
              code: 'LT-VIVE',
              quantity: 2,
              unitPrice: 12.99
            }
          ]
        }
      ],
      5: [ // ORD-2025-005 - Edinburgh Foot Care
        {
          id: 8,
          confectionId: 'EFC-CONF-001',
          patientFirstName: 'Robert',
          patientLastName: 'Wilson',
          practitioner: 'Dr. Anna Martinez',
          shoeSize: 'UK 9 / EU 43',
          status: 'Received',
          products: [
            {
              id: 19,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 20,
              type: 'Top Cover',
              name: 'Leathertec Performance 4000',
              code: 'LT-P4000',
              quantity: 1,
              unitPrice: 14.50
            },
            {
              id: 21,
              type: 'Top Cover',
              name: 'Leathertec Performance XRD',
              code: 'LT-XRD',
              quantity: 1,
              unitPrice: 14.99
            }
          ]
        },
        {
          id: 9,
          confectionId: 'EFC-CONF-002',
          patientFirstName: 'Amanda',
          patientLastName: 'Davis',
          practitioner: 'Peter Wilson',
          shoeSize: 'UK 6 / EU 39',
          status: 'Received',
          products: [
            {
              id: 22,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 23,
              type: 'Top Cover',
              name: 'Leathertec Medical Hindfoot Zone',
              code: 'LT-HFZ',
              quantity: 2,
              unitPrice: 11.25
            }
          ]
        }
      ],
      6: [ // ORD-2025-006 - London Podiatry Centre (Insole only)
        {
          id: 10,
          confectionId: 'LPC-CONF-003',
          patientFirstName: 'Sophie',
          patientLastName: 'Clarke',
          practitioner: 'Dr. Robert Thompson',
          shoeSize: 'UK 7 / EU 40',
          status: 'Draft',
          products: [
            {
              id: 24,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            }
          ]
        }
      ],
      7: [ // ORD-2025-007 - Manchester Foot Clinic (Top covers only)
        {
          id: 11,
          confectionId: 'MFC-CONF-002',
          patientFirstName: 'Sarah',
          patientLastName: 'Thompson',
          practitioner: 'Dr. David Wilson',
          shoeSize: 'UK 8 / EU 42',
          status: 'Ordered',
          products: [
            {
              id: 25,
              type: 'Top Cover',
              name: 'Leathertec Medical Hindfoot Zone',
              code: 'LT-HFZ',
              quantity: 3,
              unitPrice: 11.25
            },
            {
              id: 26,
              type: 'Top Cover',
              name: 'Leathertec Medical Forefoot Zone',
              code: 'LT-FFZ',
              quantity: 3,
              unitPrice: 10.75
            }
          ]
        },
        {
          id: 12,
          confectionId: 'MFC-CONF-003',
          patientFirstName: 'David',
          patientLastName: 'Evans',
          practitioner: 'Sarah Taylor',
          shoeSize: 'UK 10 / EU 44',
          status: 'Ordered',
          products: [
            {
              id: 27,
              type: 'Top Cover',
              name: 'Leathertec Vive',
              code: 'LT-VIVE',
              quantity: 3,
              unitPrice: 12.99
            },
            {
              id: 28,
              type: 'Top Cover',
              name: 'Leathertec Performance 4000',
              code: 'LT-P4000',
              quantity: 3,
              unitPrice: 14.50
            }
          ]
        }
      ],
      8: [ // ORD-2025-008 - Birmingham Medical Centre
        {
          id: 13,
          confectionId: 'BMC-CONF-004',
          patientFirstName: 'Rachel',
          patientLastName: 'Green',
          practitioner: 'Mark Johnson',
          shoeSize: 'UK 7 / EU 40',
          status: 'Received',
          products: [
            {
              id: 29,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 30,
              type: 'Top Cover',
              name: 'Leathertec Vive',
              code: 'LT-VIVE',
              quantity: 1,
              unitPrice: 12.99
            },
            {
              id: 31,
              type: 'Top Cover',
              name: 'Leathertec Performance XRD',
              code: 'LT-XRD',
              quantity: 1,
              unitPrice: 14.99
            }
          ]
        },
        {
          id: 14,
          confectionId: 'BMC-CONF-005',
          patientFirstName: 'Thomas',
          patientLastName: 'Baker',
          practitioner: 'Claire Smith',
          shoeSize: 'UK 11 / EU 45',
          status: 'Received',
          products: [
            {
              id: 32,
              type: 'Insole',
              name: 'PA11 Custom Insole',
              code: 'PA11-CUST-001',
              quantity: 1,
              unitPrice: 89.99
            },
            {
              id: 33,
              type: 'Top Cover',
              name: 'Leathertec Performance 4000',
              code: 'LT-P4000',
              quantity: 2,
              unitPrice: 14.50
            },
            {
              id: 34,
              type: 'Top Cover',
              name: 'Leathertec Medical Forefoot Zone',
              code: 'LT-FFZ',
              quantity: 1,
              unitPrice: 10.75
            }
          ]
        }
      ]
    };

    return confectionsData[orderId] || [];
  }

  // Calculate confection subtotal from its products - ONLY confection-level calculation
  getConfectionSubtotal(confection: OrderConfection): number {
    return confection.products.reduce((total, product) => total + (product.quantity * product.unitPrice), 0);
  }

  // Calculate product subtotal for individual products
  getProductSubtotal(product: ConfectionProduct): number {
    return product.quantity * product.unitPrice;
  }

  // Calculate order subtotal from all confections
  getOrderSubtotal(orderId: number): number {
    const confections = this.getOrderConfections(orderId);
    return confections.reduce((total, confection) => total + this.getConfectionSubtotal(confection), 0);
  }

  // Calculate VAT (20%)
  getOrderVAT(orderId: number): number {
    const subtotal = this.getOrderSubtotal(orderId);
    return subtotal * 0.2;
  }

  // Get confection status badge class
  getConfectionStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-secondary';
      case 'in cart': return 'bg-warning';
      case 'ordered': return 'bg-primary';
      case 'received': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  // Check if Edit Insole button should be enabled
  isEditInsoleEnabled(status: string): boolean {
    return status === 'Draft' || status === 'In Cart';
  }

  // Format date from YYYY-MM-DD to DD/MM/YYYY
  formatDateToEuropean(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Confection action methods
  viewPrescription(confection: OrderConfection): void {
    this.selectedConfection = confection;
    
    // Update mock data with confection-specific patient info
    this.mockPrescriptionData.personalInfo = {
      firstName: confection.patientFirstName,
      lastName: confection.patientLastName,
      dateOfBirth: '1985-03-15' // Mock date of birth
    };
    
    this.showPrescriptionModal = true;
    console.log('View prescription for confection:', confection.confectionId);
  }

  closePrescriptionModal(): void {
    this.showPrescriptionModal = false;
    this.selectedConfection = null;
  }

  editInsole(confection: OrderConfection): void {
    if (!this.isEditInsoleEnabled(confection.status)) {
      console.log('Edit insole disabled for status:', confection.status);
      return;
    }
    console.log('Edit insole for confection:', confection.confectionId);
    alert(`Edit Insole feature for ${confection.confectionId} will be implemented later.`);
  }

  downloadConfection(confection: OrderConfection): void {
    console.log('Download confection:', confection.confectionId);
    alert(`Downloading confection: ${confection.confectionId}`);
  }

  viewPatient(confection: OrderConfection): void {
    console.log('View patient:', confection.patientFirstName, confection.patientLastName);
    alert(`Viewing patient: ${confection.patientFirstName} ${confection.patientLastName}`);
  }

  // Order modal action methods
  downloadOrderDetails(): void {
    if (this.selectedOrder) {
      console.log('Download order details:', this.selectedOrder.orderNumber);
      alert(`Downloading order details for ${this.selectedOrder.orderNumber}`);
    }
  }

  printOrder(): void {
    if (this.selectedOrder) {
      console.log('Print order:', this.selectedOrder.orderNumber);
      alert(`Printing order ${this.selectedOrder.orderNumber}`);
    }
  }

  downloadPrescription(): void {
    if (this.selectedConfection) {
      console.log('Download prescription for:', this.selectedConfection.confectionId);
      alert(`Downloading prescription for ${this.selectedConfection.confectionId}`);
    }
  }

  editPrescriptionFromModal(): void {
    if (this.selectedConfection) {
      console.log('Edit prescription from modal for:', this.selectedConfection.confectionId);
      alert(`Edit Prescription feature for ${this.selectedConfection.confectionId} will be implemented later.`);
      this.closePrescriptionModal();
    }
  }

  // Existing methods with corrected signatures
  deleteOrder(order: Order, event: Event) {
    event.stopPropagation();
    console.log('Delete order:', order.orderNumber);
    // In a real app, this would call a service to delete the order
  }

  downloadDetails(order: Order) {
    console.log('Download details for order:', order.orderNumber);
    alert(`Downloading details for order ${order.orderNumber}`);
  }

  cancelOrder(order: Order) {
    console.log('Cancel order:', order.orderNumber);
    alert(`Order ${order.orderNumber} has been cancelled`);
    this.expandedOrderId = null;
  }

  trackOrder(order: Order) {
    if (order.trackingNumber) {
      console.log('Track order:', order.trackingNumber);
      alert(`Tracking order: ${order.trackingNumber}`);
    }
  }
}