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
import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy, arrayUnion } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { User } from '../../../shared/models/user.class';

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
  users: User[] = [];
  userId: string | null = null;
  currentUserUid: string | null = null;

  @Input()
  color: ThemePalette
  dialogRef: any;

  constructor(
    // private channelsService: ChannelsService, 
    private firestore: Firestore,
    private auth: Auth,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { 
  }

  ngOnInit(): void {
    this.checkDataFromDialog();
    this.getCurrentUser();
  }

  getCurrentUser() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.currentUserUid = currentUser.uid;
    }
  }

  checkDataFromDialog() {
      this.newChannelName = this.data.name || '';
      this.newChannelDescription = this.data.description || '';
      this.users = this.data.users.users || [];
  }

async createNewChannel() {
  const currentUser = this.auth.currentUser;

  if (currentUser) {
    const channelsRef = collection(this.firestore, 'channels');
    const usersRef = collection(this.firestore, 'users');
    const userDocRef = doc(usersRef, currentUser.uid);

    if (this.selectedValue == 'addAll') {

      const newChannel: Channel = new Channel({
        name: this.newChannelName,
        description: this.newChannelDescription,
        users: this.users,
        channelAuthor: currentUser.uid,
      });

      const channelDocRef = await addDoc(channelsRef, {
        name: newChannel.name,
        description: newChannel.description,
        users: newChannel.users,
        channelAuthor: newChannel.channelAuthor,
      });

      await updateDoc(userDocRef, {
        channels: arrayUnion({
          name: newChannel.name,
          id: channelDocRef.id
        })
      });
    } else {
      console.log('Keine User ausgewählt');
    }
  }
}

  onSelectionChange(event: any) {
    this.selectedValue = event.value;
  }
}
