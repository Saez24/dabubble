import { Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroupDirective, FormsModule, NgForm, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { IconsService } from '../../shared/services/icons/icons.service';
import { AddPeopleDialog } from './add-people-dialog/add-people-dialog.component';
import { ErrorStateMatcher } from '@angular/material/core';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

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
    FormsModule,
    AddPeopleDialog
],
  templateUrl: './create-new-channel-dialog.component.html',
  styleUrl: './create-new-channel-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
  
})
export class CreateNewChannelDialog {

  newChannelName: string = '';
  newChannelDescription: string = '';
  channelList: { name: string, description: string } [] = [];

  constructor(
    private iconsService: IconsService, 
    private dialogRef: MatDialogRef<CreateNewChannelDialog>,
    private dialog: MatDialog
  ) {
    this.loadChannelList();
  }

  nameFormControl = new FormControl('', [Validators.required]);
  matcher: MyErrorStateMatcher = new MyErrorStateMatcher();
  formSubmitted = false;

  nextDialog() {
    this.formSubmitted = true;
    if (this.newChannelName.trim()) {
      this.channelList.push({
        name: this.newChannelName,
        description: this.newChannelDescription || ''
      });
      this.saveChannelList();
      this.clearInputs();
      this.dialogRef.close();
      this.dialog.open(AddPeopleDialog);
    }
  }

  clearInputs() {
      this.newChannelName = '';
      this.newChannelDescription = '';
  }

  saveChannelList() {
    localStorage.setItem('channelList', JSON.stringify(this.channelList));
  }

  loadChannelList() {
    let storedList = localStorage.getItem('channelList');
    if (storedList) {
      this.channelList = JSON.parse(storedList);
    }
  }

  isValid(): boolean {
    return this.newChannelName.trim().length > 0;
  }
}