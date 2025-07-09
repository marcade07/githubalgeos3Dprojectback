import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Practitioner } from '../../interfaces/common.interfaces';

@Component({
  selector: 'app-practitioners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practitioners.component.html',
  styleUrl: './practitioners.component.scss'
})
export class PractitionersComponent implements OnInit {
  practitioners: Practitioner[] = [];
  filteredPractitioners: Practitioner[] = [];
  searchTerm: string = '';
  professionFilter: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getPractitioners().subscribe(practitioners => {
      this.practitioners = practitioners;
      this.filteredPractitioners = practitioners;
    });
  }

  filterPractitioners() {
    this.filteredPractitioners = this.practitioners.filter(practitioner => {
      const matchesSearch = practitioner.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           practitioner.surname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           practitioner.clinic.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesProfession = !this.professionFilter || practitioner.profession === this.professionFilter;
      return matchesSearch && matchesProfession;
    });
  }
}