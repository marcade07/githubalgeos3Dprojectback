import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Product, ProductOption } from '../../interfaces/common.interfaces';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  activeTab: 'top-covers' | 'insoles' = 'top-covers';
  
  // Top Covers data
  topCovers: Product[] = [];
  filteredTopCovers: Product[] = [];
  topCoversSearchTerm: string = '';
  
  // Top Cover modal properties
  showTopCoverModal: boolean = false;
  selectedTopCover: any = null;
  isTopCoverEditMode: boolean = false;
  
  // Insoles data
  insoles: Product[] = [];
  filteredInsoles: Product[] = [];
  insolesSearchTerm: string = '';

  // Edit insole modal properties
  showEditInsoleModal: boolean = false;
  selectedInsole: Product | null = null;
  fullLengthOption: { price: number } = { price: 10.00 };
  
  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.dataService.getOtherProducts().subscribe(products => {
      // Separate products by type
      this.topCovers = products.filter(product => product.productType === 'Top Cover');
      this.insoles = products.filter(product => product.productType === 'Insoles');
      
      // Initialize filtered arrays
      this.filteredTopCovers = this.topCovers;
      this.filteredInsoles = this.insoles;
    });
  }

  setActiveTab(tab: 'top-covers' | 'insoles') {
    this.activeTab = tab;
  }

  filterTopCovers() {
    this.filteredTopCovers = this.topCovers.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(this.topCoversSearchTerm.toLowerCase()) ||
                           product.code.toLowerCase().includes(this.topCoversSearchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(this.topCoversSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  filterInsoles() {
    this.filteredInsoles = this.insoles.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(this.insolesSearchTerm.toLowerCase()) ||
                           product.code.toLowerCase().includes(this.insolesSearchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(this.insolesSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  // Edit insole modal methods
  editInsole(insole: Product): void {
    this.selectedInsole = { ...insole }; // Create a copy to avoid direct mutation
    
    // Load Full Length option if this is PA11 Custom Insole
    if (this.isPA11CustomInsole(insole)) {
      const fullLengthOption = insole.options?.find(opt => opt.id === 'full-length');
      if (fullLengthOption) {
        this.fullLengthOption = { price: fullLengthOption.price };
      } else {
        // Create default Full Length option if it doesn't exist
        this.fullLengthOption = { price: 10.00 };
      }
    }
    
    this.showEditInsoleModal = true;
    console.log('Edit insole:', insole.name);
  }

  closeEditInsoleModal(): void {
    this.showEditInsoleModal = false;
    this.selectedInsole = null;
    
    // Reset full length option to defaults
    this.fullLengthOption = { price: 10.00 };
  }

  saveInsoleChanges(): void {
    if (this.selectedInsole) {
      // If this is PA11 Custom Insole, save the Full Length option
      if (this.isPA11CustomInsole(this.selectedInsole)) {
        if (!this.selectedInsole.options) {
          this.selectedInsole.options = [];
        }
        
        // Find existing Full Length option or add new one
        const existingOptionIndex = this.selectedInsole.options.findIndex(opt => opt.id === 'full-length');
        const fullLengthOptionData: ProductOption = {
          id: 'full-length',
          name: 'Full Length',
          enabled: true,
          price: this.fullLengthOption.price,
          description: 'Option only available when designing a custom insole. Cannot be ordered alone.'
        };
        
        if (existingOptionIndex !== -1) {
          this.selectedInsole.options[existingOptionIndex] = fullLengthOptionData;
        } else {
          this.selectedInsole.options.push(fullLengthOptionData);
        }
      }
      
      // Find the original insole in the array and update it
      const originalIndex = this.insoles.findIndex(insole => insole.id === this.selectedInsole!.id);
      if (originalIndex !== -1) {
        this.insoles[originalIndex] = { ...this.selectedInsole };
        // Re-filter the insoles to reflect changes
        this.filterInsoles();
      }
      
      console.log('Saving insole changes:', this.selectedInsole);
      if (this.isPA11CustomInsole(this.selectedInsole)) {
        console.log('Full Length Option Price:', this.fullLengthOption.price);
      }
      
      // In a real application, you would send this data to a service/API
      alert(`Insole "${this.selectedInsole.name}" has been updated successfully!`);
      
      this.closeEditInsoleModal();
    }
  }

  // Helper method to check if the insole is PA11 Custom Insole
  isPA11CustomInsole(insole: Product): boolean {
    return insole.code === 'PA11-CUST-001' && insole.name === 'PA11 Custom Insole';
  }

  // Helper method to check if Full Length option should be shown in the modal
  shouldShowFullLengthOption(): boolean {
    return this.selectedInsole ? this.isPA11CustomInsole(this.selectedInsole) : false;
  }
  // View and delete methods for insoles (to match template buttons)
  viewInsole(insole: Product): void {
    console.log('View insole:', insole.name);
    alert(`Viewing insole: ${insole.name}`);
  }

  deleteInsole(insole: Product): void {
    if (confirm(`Are you sure you want to delete insole "${insole.name}"?`)) {
      // Remove from main array
      this.insoles = this.insoles.filter(i => i.id !== insole.id);
      // Re-filter to update display
      this.filterInsoles();
      
      console.log('Delete insole:', insole.name);
      alert(`Insole "${insole.name}" has been deleted.`);
    }
  }

  // View and delete methods for top covers (to match template buttons)
  viewTopCover(product: Product): void {
    this.selectedTopCover = this.getTopCoverSpecifications(product);
    this.isTopCoverEditMode = false;
    this.showTopCoverModal = true;
    console.log('View top cover:', product.name);
  }

  editTopCover(product: Product): void {
    this.selectedTopCover = this.getTopCoverSpecifications(product);
    this.isTopCoverEditMode = true;
    this.showTopCoverModal = true;
    console.log('Edit top cover:', product.name);
  }

  // Close top cover modal
  closeTopCoverModal(): void {
    this.showTopCoverModal = false;
    this.selectedTopCover = null;
    this.isTopCoverEditMode = false;
  }

  // Save top cover changes (placeholder for edit mode)
  saveTopCoverChanges(): void {
    if (this.selectedTopCover) {
      // Find the original product in the topCovers array and update it
      const originalIndex = this.topCovers.findIndex(product => product.id === this.selectedTopCover.id);
      if (originalIndex !== -1) {
        // Update the original product with the modified data
        this.topCovers[originalIndex] = {
          ...this.topCovers[originalIndex],
          status: this.selectedTopCover.status
        };
        
        // Re-filter to reflect changes in the table
        this.filterTopCovers();
      }
      
      console.log('Saving top cover changes:', this.selectedTopCover);
      alert(`Top Cover "${this.selectedTopCover.name}" has been updated successfully! Status: ${this.selectedTopCover.status}`);
      this.closeTopCoverModal();
    }
  }

  // Get detailed specifications for a top cover product
  getTopCoverSpecifications(product: Product): any {
    // Mock detailed specifications based on the product
    const baseSpec = {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      price: product.price,
      status: product.status,
      productPhoto: '/assets/images/top-cover-placeholder.jpg' // Placeholder image path
    };

    // Specific specifications for each Leathertec product
    switch (product.code) {
      case 'LT-VIVE':
        return {
          ...baseSpec,
          range: 'Sport',
          texture: 'Synthetic Microfibre',
          colour: 'Charcoal',
          technical: {
            material: '100% microfiber product',
            base: 'Velour fastening',
            thickness: '3.2mm',
            density: '16ft/ft3',
            breathability: 'Absorption - Desorption = Complete dryness',
            shockAbsorption: 'High Propulsion',
            patientComfort: 'Temperature-regulating effect / Antibacterial / Antimicrobial',
            touch: 'Smooth',
            sweatAbsorption: 'Sweat-resistant',
            hypoallergenic: 'Yes',
            maintenance: 'Washable (without shrinking and keeps all its properties)',
            recommendedFor: 'Trainers',
            brandsoleOptions: 'Standard',
            sizeRange: '35 - 55'
          }
        };

      case 'LT-P4000':
        return {
          ...baseSpec,
          range: 'Everyday',
          texture: 'Synthetic Microfibre',
          colour: 'Charcoal',
          technical: {
            material: '100% microfiber product',
            base: 'Velour fastening',
            thickness: '3.2mm',
            density: '20ft/ft3',
            breathability: 'Absorption - Desorption = Complete dryness',
            shockAbsorption: 'Medium',
            patientComfort: 'Temperature-regulating effect / Antibacterial / Antimicrobial',
            touch: 'Smooth',
            sweatAbsorption: 'Sweat-resistant',
            hypoallergenic: 'Yes',
            maintenance: 'Washable (without shrinking and keeps all its properties)',
            recommendedFor: 'Trainers/Business/Casual/Outdoor',
            brandsoleOptions: 'Standard',
            sizeRange: '35 - 55'
          }
        };

      case 'LT-XRD':
        return {
          ...baseSpec,
          range: 'Protect',
          texture: 'Synthetic Microfibre',
          colour: 'Charcoal',
          technical: {
            material: '100% microfiber product',
            base: 'Velour fastening',
            thickness: '3.2mm',
            density: '15ft/ft3',
            breathability: 'Absorption - Desorption = Complete dryness',
            shockAbsorption: 'High',
            patientComfort: 'Temperature-regulating effect / Antibacterial / Antimicrobial',
            touch: 'Smooth',
            sweatAbsorption: 'Sweat-resistant',
            hypoallergenic: 'Yes',
            maintenance: 'Washable (without shrinking and keeps all its properties)',
            recommendedFor: 'Trainers/Business/Casual/Outdoor',
            brandsoleOptions: 'Standard',
            sizeRange: '35 - 55'
          }
        };

      case 'LT-HFZ':
        return {
          ...baseSpec,
          range: 'Care Hindfoot Zone',
          texture: 'Synthetic Microfibre',
          colour: 'Charcoal',
          technical: {
            material: '100% microfiber product',
            base: 'Velour fastening',
            thickness: '3.2mm',
            density: '15ft/ft3 Heel – 20ft/ft3 Forefoot',
            breathability: 'Absorption - Desorption = Complete dryness',
            shockAbsorption: 'Low/Medium',
            patientComfort: 'Temperature-regulating effect / Antibacterial / Antimicrobial',
            touch: 'Smooth',
            sweatAbsorption: 'Sweat-resistant',
            hypoallergenic: 'Yes',
            maintenance: 'Washable (without shrinking and keeps all its properties)',
            recommendedFor: 'Business/Casual',
            brandsoleOptions: 'Standard',
            sizeRange: '35 - 55'
          }
        };

      case 'LT-FFZ':
        return {
          ...baseSpec,
          range: 'Care Forefoot Zone',
          texture: 'Synthetic Microfibre',
          colour: 'Charcoal',
          technical: {
            material: '100% microfiber product',
            base: 'Velour fastening',
            thickness: '2.4mm',
            density: '20ft/ft3 Heel – 15ft/ft3 Forefoot',
            breathability: 'Absorption - Desorption = Complete dryness',
            shockAbsorption: 'Medium/Low',
            patientComfort: 'Temperature-regulating effect / Antibacterial / Antimicrobial',
            touch: 'Smooth',
            sweatAbsorption: 'Sweat-resistant',
            hypoallergenic: 'Yes',
            maintenance: 'Washable (without shrinking and keeps all its properties)',
            recommendedFor: 'Business/Casual',
            brandsoleOptions: 'Standard',
            sizeRange: '35 - 55'
          }
        };

      default:
        return {
          ...baseSpec,
          range: 'Standard',
          texture: 'Standard surface',
          colour: 'Grey',
          technical: {
            material: 'Standard foam',
            base: 'Standard base',
            thickness: '6mm',
            density: '16ft/ft3',
            breathability: 'Good',
            shockAbsorption: 'Good',
            patientComfort: 'Good',
            touch: 'Standard',
            sweatAbsorption: 'Standard',
            hypoallergenic: 'Yes',
            maintenance: 'Standard care',
            recommendedFor: 'General use',
            brandsoleOptions: 'Standard',
            sizeRange: '35 - 55'
          }
        };
    }
  }

  deleteTopCover(product: Product): void {
    if (confirm(`Are you sure you want to delete top cover "${product.name}"?`)) {
      // Remove from main array
      this.topCovers = this.topCovers.filter(tc => tc.id !== product.id);
      // Re-filter to update display
      this.filterTopCovers();
      
      console.log('Delete top cover:', product.name);
      alert(`Top cover "${product.name}" has been deleted.`);
    }
  }

  // Helper method to get Full Length additional price for display in table
  getFullLengthOptionPrice(product: Product): string {
    const fullLengthOption = product.options?.find(opt => opt.id === 'full-length');
    
    if (fullLengthOption && fullLengthOption.price > 0) {
      return `+£${fullLengthOption.price.toFixed(2)}`;
    }
    
    return '—';
  }
}