import { NgFor } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog.component';


@Component({
  selector: 'app-members-dialog',
  standalone: true,
  imports: [
    NgFor,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './members-dialog.component.html',
  styleUrl: './members-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MembersDialogComponent {
  constructor(
    public channelsService: ChannelsService,
    public dialogRef: MatDialogRef<AddMemberDialogComponent>,
    public dialog: MatDialog
  ) {}

  closeDialog() {
    this.dialogRef.close();
  }

  openAddMemberDialog() {
    this.dialog.open(AddMemberDialogComponent)
  }
}
