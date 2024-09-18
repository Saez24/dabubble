import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ThemePalette } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-add-people-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './add-people-dialog.component.html',
  styleUrls: ['./add-people-dialog.component.scss', '../create-new-channel-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class AddPeopleDialog {

  contacts = [
    { firstName: 'Anna', lastName: 'Müller', avatar: '../../../../assets/images/avatars/avatar1.svg', online: true },
    { firstName: 'Ben', lastName: 'Schmidt', avatar:  '../../../../assets/images/avatars/avatar2.svg', online: true },
    { firstName: 'Clara', lastName: 'Meier', avatar: '../../../../assets/images/avatars/avatar3.svg', online: true },
    { firstName: 'David', lastName: 'Schneider', avatar: '../../../../assets/images/avatars/avatar4.svg', online: false },
    { firstName: 'Ella', lastName: 'Fischer', avatar: '../../../../assets/images/avatars/avatar5.svg', online: true },
    { firstName: 'Felix', lastName: 'Weber', avatar: '../../../../assets/images/avatars/avatar6.svg', online: true }
  ];

  selectedValue: string = 'addAll';

  @Input()
  color: ThemePalette
  
  nextDialog() {

  }

  onSelectionChange(event: any) {
    console.log('Selected value:', event.value);
  }
}
