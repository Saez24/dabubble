import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon'; 
import { MatCardModule } from '@angular/material/card';
import { IconsService } from '../../shared/services/icons/icons.service';
import { NgClass, NgFor, NgStyle } from '@angular/common';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateNewChannelDialog } from '../../dialogs/create-new-channel-dialog/create-new-channel-dialog.component';
import { Channel } from '../../shared/models/channel.class';
import { collection, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { User } from '../../shared/models/user.class';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    MatExpansionModule, 
    MatIconModule, 
    MatCardModule, 
    NgFor, 
    NgClass, 
    NgStyle,
    CreateNewChannelDialog
  ], 
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss', 
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent {

  channels: Channel[] = [];
  users: User[] = [];
  clickedChannels: boolean[] = [];
  clickedUsers: boolean[] = [];
  icons: string[] = [];
  panelOpenState = false;
  arrowRotated: boolean[] = [false, false]; 
  currentUserUid: string | null = null;

  constructor(
    public dialog: MatDialog,
    private iconsService: IconsService, 
    private channelsService: ChannelsService,
    private firestore: Firestore,
    private auth: Auth
  ) { }

   ngOnInit() {
    this.getCurrentUser();
    this.loadUsers();
    this.loadChannels();
  }
  
  async loadChannels() {
    const channelsRef = collection(this.firestore, 'channels');
    const channelsQuery = query(channelsRef, orderBy('name'));
  
    onSnapshot(channelsQuery, async (snapshot) => {
      this.channels = await Promise.all(snapshot.docs.map(async (doc) => {
        const channelData = doc.data() as Channel;
        return { ...channelData, id: doc.id };
      }));
    });
  }

  async loadUsers() {
    const usersRef = collection(this.firestore, 'users');
    const usersQuery = query(usersRef, orderBy('name'));
  
    onSnapshot(usersQuery, async (snapshot) => {
      this.users = await Promise.all(snapshot.docs.map(async (doc) => {
        const userData = doc.data() as User;
        return { ...userData, id: doc.id };
      }));
    });
  }

  getCurrentUser() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.currentUserUid = currentUser.uid;
    }
  }
  

  // method to rotate arrow icon
  rotateArrow(i: number){
    this.arrowRotated[i] = !this.arrowRotated[i];  
  }

  // method to change background color for channel or user container
  clickContainer(i: number, type: 'channel' | 'user') {
    if (type === 'channel') {
      this.clickChannelContainer(i);
    } else if (type === 'user') {
      this.clickUserContainer(i)
    }
  }

  // helper method to toggle the clickContainer method
  clickChannelContainer (i: number) {
    this.clickedChannels.fill(false);
    this.clickedUsers.fill(false);
    this.clickedChannels[i] = true;
  }

  // helper method to toggle the clickContainer method
  clickUserContainer (i: number) {
    this.clickedUsers.fill(false);
    this.clickedChannels.fill(false);
    this.clickedUsers[i] = true;
  }

  openDialog() {
    this.dialog.open(CreateNewChannelDialog, {
      data: {
        users: this.users,
      }
    });
  }
}



