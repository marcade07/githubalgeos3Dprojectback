import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { MetricCard } from '../../interfaces/common.interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentMonthMetrics: MetricCard[] = [];
  allTimeMetrics: MetricCard[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getCurrentMonthMetrics().subscribe(metrics => {
      this.currentMonthMetrics = metrics;
    });

    this.dataService.getAllTimeMetrics().subscribe(metrics => {
      this.allTimeMetrics = metrics;
    });
  }
}