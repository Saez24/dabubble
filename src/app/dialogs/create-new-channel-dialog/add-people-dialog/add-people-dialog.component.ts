import { Component, Inject, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ChannelsService } from '../../../shared/services/channels/channels.service';
import { CreateNewChannelDialog } from '../create-new-channel-dialog.component';
import { Channel } from '../../../shared/models/channel.class';
import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-people-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,
    FormsModule,
    CreateNewChannelDialog
  ],
  templateUrl: './add-people-dialog.component.html',
  styleUrls: ['./add-people-dialog.component.scss', '../create-new-channel-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class AddPeopleDialog implements OnInit {

  selectedValue: string = 'addAll';
  channel: Channel | null = null;
  newChannelName: string = '';
  newChannelDescription: string = '';

  @Input()
  color: ThemePalette
  dialogRef: any;

  constructor(
    // private channelsService: ChannelsService, 
    private firestore: Firestore,
    @Inject(MAT_DIALOG_DATA) public data: { name: string, description: string },
  ) { }

  ngOnInit(): void {
    this.checkdataFromDialog();
  }

  checkdataFromDialog() {
    if (this.data) {
      this.newChannelName = this.data.name || '';
      this.newChannelDescription = this.data.description || '';
    } else {
      this.newChannelName = '';
      this.newChannelDescription = '';
    }
  }
    
  async createNewChannel() {
    const channelsRef = collection(this.firestore, 'channels');
    const newChannelRef = doc(channelsRef);

    const newChannel: Channel = new Channel({
        id: newChannelRef.id,
        name: this.newChannelName,
        description: this.newChannelDescription,
        users: [this.selectedValue],
    });

    await addDoc(channelsRef, {
        id: newChannel.id,
        name: newChannel.name,
        description: newChannel.description,
        users: newChannel.users,
    });

  } 

  onSelectionChange(event: any) {
    this.selectedValue = event.value;
  }
}
