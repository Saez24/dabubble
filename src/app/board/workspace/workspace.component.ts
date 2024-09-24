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
import { collection, doc, documentId, Firestore, getDoc, getDocs, onSnapshot, orderBy, query, where } from '@angular/fire/firestore';
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
  currentUserChannels: Channel[] = [];
  
  constructor(
    public dialog: MatDialog,
    private iconsService: IconsService, 
    private channelsService: ChannelsService,
    private firestore: Firestore,
    private auth: Auth
  ) { }
  
  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUserUid = user.uid;
        this.loadUsers();
        this.loadChannels(this.currentUserUid);
      } else {
        console.log('Kein Benutzer angemeldet');
      }
    });
  }
  
  async loadChannels(currentUserUid: string) {
    let channelsRef = collection(this.firestore, 'channels');
    let channelsQuery = query(channelsRef, orderBy('name'));

    onSnapshot(channelsQuery, async (snapshot) => {
        this.channels = await Promise.all(snapshot.docs.map(async (doc) => {
            let channelData = doc.data() as Channel;
            return { ...channelData, id: doc.id };
        }));

        if (currentUserUid) {
            let userChannels = this.channels.filter(channel => {
                return channel.members && channel.members.includes(currentUserUid);
            });
            this.currentUserChannels = userChannels;
        } else {
          this.currentUserChannels = [];
        }
    });
  }

  async loadUsers() {
    let usersRef = collection(this.firestore, 'users');
    let usersQuery = query(usersRef, orderBy('name'));
  
    onSnapshot(usersQuery, async (snapshot) => {
      this.users = await Promise.all(snapshot.docs.map(async (doc) => {
        let userData = doc.data() as User;
        return { ...userData, id: doc.id };
      }));
      // console.log('Geladene User:', this.users);
    });
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

// Alternative Methode, um auf die Kanäle des Nutzers zuzugreifen

  // getUserChannels(uid: string) {
  //   const userDocRef = doc(this.firestore, `users/${uid}`);
  //   onSnapshot(userDocRef, (doc) => {
  //     if (doc.exists()) {
  //       const data = doc.data() as {
  //         channels: string[];
  //       };
  //       this.currentUserChannels = data.channels,
  //       console.log('Benutzerinformationen:', this.currentUserChannels);
  //     } else {
  //       console.log('Kein Benutzerdokument gefunden');
  //     }
  //   });
  // }


    // getCurrentUser() {
  //   const currentUser = this.auth.currentUser;
  //   if (currentUser) {
  //     this.currentUserUid = currentUser.uid; 
  //   } else {
  //     console.log('Kein Benutzer angemeldet');
  //   }
  // }



