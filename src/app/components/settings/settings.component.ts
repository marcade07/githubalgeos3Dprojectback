import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  activeSection: string = 'roles';

  // View permissions method - read-only functionality
  viewPermissions(roleName: string): void {
    console.log(`Viewing permissions for role: ${roleName}`);
    alert(`Viewing permissions for ${roleName} role. This feature will display read-only permission details.`);
  }
}