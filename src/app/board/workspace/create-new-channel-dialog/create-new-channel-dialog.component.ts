import { Component } from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { IconsService } from '../../../shared/services/icons/icons.service';

@Component({
  selector: 'app-create-new-channel-dialog',
  standalone: true,
  imports: [
    MatDialogTitle, 
    MatDialogContent, 
    MatDialogActions, 
    MatDialogClose, 
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './create-new-channel-dialog.component.html',
  styleUrl: './create-new-channel-dialog.component.scss'
})
export class CreateNewChannelDialog {

  constructor(private iconsService: IconsService) {

  }

}
