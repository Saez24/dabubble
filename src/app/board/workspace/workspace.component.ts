import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon'; 
import { MatCardModule } from '@angular/material/card';
import { IconsService } from '../shared/services/icons.service';
import { AvatarsService } from '../shared/services/avatars.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule, MatButtonModule, MatCardModule, NgFor], 
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss', 
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class WorkspaceComponent {

  panelOpenState = false;
  avatars: string[] = [];

  constructor(private iconsService: IconsService, private avatarsService: AvatarsService) {
    this.avatars = this.avatarsService.getAvatars();
   }


}

