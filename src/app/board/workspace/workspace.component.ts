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
import { MessagesService } from '../../shared/services/messages/messages.service';

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
  currentUser: User | any;

  constructor(
    public dialog: MatDialog,
    private iconsService: IconsService,
    public channelsService: ChannelsService,
    private firestore: Firestore,
    private auth: Auth,
    private messageService: MessagesService
  ) {
  }

  ngOnInit() {
    this.loadData();
    this.fillArraysWithBoolean();
  }

  async loadData() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUserUid = user.uid;
        await this.loadUsers(this.currentUserUid);
        await this.channelsService.loadChannels(this.currentUserUid);
      } else {
        console.log('Kein Benutzer angemeldet');
      }
    });
  }

  async loadUsers(currentUserId: string) {
    let usersRef = collection(this.firestore, 'users');
    let usersQuery = query(usersRef, orderBy('name'));

    onSnapshot(usersQuery, async (snapshot) => {
      this.users = await Promise.all(snapshot.docs.map(async (doc) => {
        let userData = doc.data() as User;
        return { ...userData, id: doc.id };
      }));
      this.loadCurrentUser(currentUserId);
    });
  }

  loadCurrentUser(currentUserId: string) {
    this.currentUser = this.users.find(user => user.id === currentUserId);
    console.log(this.currentUser)
  }

  fillArraysWithBoolean() {
    this.channelsService.initializeArrays(this.currentUserChannels.length, this.users.length);
  }

  // method to rotate arrow icon
  rotateArrow(i: number) {
    this.arrowRotated[i] = !this.arrowRotated[i];
  }

  // method to change background color for channel or user container
  openChannel(channel: Channel, i: number) {
    this.channelsService.clickChannelContainer(channel, i);
    this.messageService.loadMessages(channel.id);
  }

  clickUserContainer(user: User, i: number) {
    this.channelsService.clickUserContainer(user, i);
  }

  // helper method to toggle the clickContainer method
  openDialog() {
    this.dialog.open(CreateNewChannelDialog)
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


// async loadChannels(currentUserUid: string) {
//   let channelsRef = collection(this.firestore, 'channels');
//   let channelsQuery = query(channelsRef, orderBy('name'));

//   onSnapshot(channelsQuery, async (snapshot) => {
//     this.channels = await Promise.all(snapshot.docs.map(async (doc) => {
//       let channelData = doc.data() as Channel;
//       return { ...channelData, id: doc.id };
//     }));

//     if (currentUserUid) {
//       let userChannels = this.channels.filter(channel => {
//         return channel.members && channel.members.includes(currentUserUid);
//       });
//       this.currentUserChannels = userChannels;
//     } else {
//       this.currentUserChannels = [];
//     }
//   });
// }



