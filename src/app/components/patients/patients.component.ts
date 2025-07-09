import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Patient, Confection } from '../../interfaces/common.interfaces';

interface PrescriptionData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  medicalInfo: {
    height: string;
    weight: string;
    shoeSizeUK: string;
    shoeSizeEU: string;
    typeOfShoes: string;
    footWidth: string;
    footType: string;
    archType: string;
    footRange: string;
    stjAxisLocation: string;
    symptomsOrDiagnosis: string;
    comments: string;
  };
  associatedScans: Array<{
    scanType: string;
    date: string;
    foot: 'Left' | 'Right';
  }>;
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchTerm: string = '';
  clinicFilter: string = '';
  expandedPatientId: number | null = null;
  patientConfections: { [key: number]: Confection[] } = {};
  
  // Prescription modal properties - ALL REQUIRED PROPERTIES
  showPrescriptionModal: boolean = false;
  selectedConfection: any = null;
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
    this.dataService.getPatients().subscribe(patients => {
      this.patients = patients;
      this.filteredPatients = patients;
    });
  }

  filterPatients() {
    this.filteredPatients = this.patients.filter(patient => {
      const matchesSearch = patient.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           patient.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           patient.patientId.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesClinic = !this.clinicFilter || patient.clinic === this.clinicFilter;
      return matchesSearch && matchesClinic;
    });
  }

  getUniqueClinics(): string[] {
    return [...new Set(this.patients.map(patient => patient.clinic))].sort();
  }

  // Format date from YYYY-MM-DD to DD/MM/YYYY - REQUIRED METHOD
  formatDateToEuropean(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Toggle patient row expansion - works for both row click and chevron button click
  togglePatientExpansion(patient: Patient, event: Event) {
    // Check if the click came from action buttons (but allow chevron button)
    const target = event.target as HTMLElement;
    const isChevronButton = target.closest('.chevron-btn');
    const isActionButton = target.closest('.action-buttons') && !isChevronButton;
    
    // Prevent action buttons (except chevron) from triggering row expansion
    if (isActionButton) {
      return;
    }

    if (this.expandedPatientId === patient.id) {
      // Collapse if already expanded
      this.expandedPatientId = null;
    } else {
      // Expand and load confections
      this.expandedPatientId = patient.id;
      this.loadPatientConfections(patient.id);
    }
  }

  // Load confections for a specific patient
  loadPatientConfections(patientId: number) {
    if (!this.patientConfections[patientId]) {
      this.dataService.getConfectionsByPatientId(patientId).subscribe(confections => {
        this.patientConfections[patientId] = confections;
      });
    }
  }

  // Check if patient is expanded
  isPatientExpanded(patientId: number): boolean {
    return this.expandedPatientId === patientId;
  }

  // Get confections for a patient
  getPatientConfections(patientId: number): Confection[] {
    return this.patientConfections[patientId] || [];
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'bg-secondary';
      case 'in cart': return 'bg-warning';
      case 'ordered': return 'bg-primary';
      case 'received': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  // REQUIRED METHOD: viewPrescription - Opens the prescription modal for the given confection
  viewPrescription(confection: any): void {
    this.selectedConfection = confection;
    
    // Update mock data with patient info based on confection
    const patient = this.patients.find(p => 
      this.patientConfections[p.id]?.some(c => c.id === confection.id)
    );
    
    if (patient) {
      this.mockPrescriptionData.personalInfo = {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth
      };
    }
    
    this.showPrescriptionModal = true;
    console.log('View prescription for confection:', confection.confectionId);
  }

  // REQUIRED METHOD: editPrescription - Placeholder for editing prescription
  editPrescription(confection: any): void {
    console.log('Edit prescription for confection:', confection.confectionId);
    // This feature will be implemented later as requested
    alert(`Edit Prescription feature for ${confection.confectionId} will be implemented later.`);
  }

  // REQUIRED METHOD: closePrescriptionModal - Closes the prescription modal
  closePrescriptionModal(): void {
    this.showPrescriptionModal = false;
    this.selectedConfection = null;
  }

  // REQUIRED METHOD: downloadPrescription - Placeholder function for the download button in the modal
  downloadPrescription(): void {
    if (this.selectedConfection) {
      console.log('Download prescription for:', this.selectedConfection.confectionId);
      alert(`Downloading prescription for ${this.selectedConfection.confectionId}`);
    }
  }

  // REQUIRED METHOD: editPrescriptionFromModal - Placeholder function for the edit button in the modal
  editPrescriptionFromModal(): void {
    if (this.selectedConfection) {
      console.log('Edit prescription from modal for:', this.selectedConfection.confectionId);
      alert(`Edit Prescription feature for ${this.selectedConfection.confectionId} will be implemented later.`);
      this.closePrescriptionModal();
    }
  }

  // Additional confection action methods (for template compatibility)
  viewConfection(confection: Confection, event: Event) {
    event.stopPropagation();
    console.log('View confection:', confection.confectionId);
    alert(`Viewing confection: ${confection.confectionId}`);
  }

  editConfection(confection: Confection, event: Event) {
    event.stopPropagation();
    console.log('Edit confection:', confection.confectionId);
    alert(`Editing confection: ${confection.confectionId}`);
  }

  downloadConfection(confection: Confection, event: Event) {
    event.stopPropagation();
    console.log('Download confection:', confection.confectionId);
    alert(`Downloading confection: ${confection.confectionId}`);
  }

  // Patient actions - Updated to only require patient parameter (as requested)
  viewPatient(patient: Patient) {
    console.log('View patient:', patient.firstName, patient.lastName);
    alert(`Viewing patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.patientId})`);
  }

  editPatient(patient: Patient) {
    console.log('Edit patient:', patient.firstName, patient.lastName);
    alert(`Editing patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.patientId})`);
  }

  deletePatient(patient: Patient) {
    if (confirm(`Are you sure you want to delete patient ${patient.firstName} ${patient.lastName}?`)) {
      console.log('Delete patient:', patient.firstName, patient.lastName);
      // Remove from filtered list for demo purposes
      this.filteredPatients = this.filteredPatients.filter(p => p.id !== patient.id);
      this.patients = this.patients.filter(p => p.id !== patient.id);
      // Close expansion if this patient was expanded
      if (this.expandedPatientId === patient.id) {
        this.expandedPatientId = null;
      }
      alert(`Patient ${patient.firstName} ${patient.lastName} has been deleted.`);
    }
  }
}