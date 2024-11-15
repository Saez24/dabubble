import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { IconsService } from '../../shared/services/icons/icons.service';
import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateNewChannelDialog } from '../../dialogs/create-new-channel-dialog/create-new-channel-dialog.component';
import { Channel } from '../../shared/models/channel.class';
import { collection, doc, Firestore, getDocs, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Auth, User as FirebaseUser } from '@angular/fire/auth';
import { User } from '../../shared/models/user.class';
import { MessagesService } from '../../shared/services/messages/messages.service';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { ChatUtilityService } from '../../shared/services/messages/chat-utility.service';
import { Overlay } from '@angular/cdk/overlay';
import { MatBadgeModule } from '@angular/material/badge';
import { Message } from '../../shared/models/message.class';
import { DirectMessage } from '../../shared/models/direct.message.class';

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
    MatBadgeModule,
    NgIf
  ],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WorkspaceComponent implements OnInit {
  directMessages: DirectMessage[] = [];
  channels: Channel[] = [];
  users: User[] = [];
  clickedChannels: boolean[] = [];
  clickedUsers: boolean[] = [];
  icons: string[] = [];
  panelOpenState = false;
  arrowRotated: boolean[] = [false, false];
  isUnread: boolean = false;
  currentUserUid: string | null = null;
  currentUserChannels: Channel[] = [];
  userConversationCount: number = 0;
  unreadMessagesCount: number = 0;
  @Input() openChatWindow!: () => void;
  @Output() openChannelEvent = new EventEmitter<void>();
  @Output() clickUserEvent = new EventEmitter<void>();

  triggerOpenChat() {
    this.chatUtilityService.openChatWindow();
  }

  constructor(
    public dialog: MatDialog,
    private iconsService: IconsService,
    public channelsService: ChannelsService,
    private authService: AuthService,
    private firestore: Firestore,
    private auth: Auth,
    private messagesService: MessagesService,
    private chatUtilityService: ChatUtilityService,
    private overlay: Overlay,
  ) {
  }

  ngOnInit() {
    this.authService.auth.onAuthStateChanged((user: FirebaseUser | null) => {
      if (user) {
        this.loadData(user); // Pass the user to loadData
        this.fillArraysWithBoolean();
      } else {
        console.log('No user logged in');
      }
    });

    this.chatUtilityService.openDirectMessageEvent.subscribe(({ selectedUser, index }) => {
      this.clickUserContainer(selectedUser, index);
    });

    this.chatUtilityService.openChannelMessageEvent.subscribe(({ selectedChannel, index }) => {
      this.openChannel(selectedChannel, index);
    });

    this.loadAllConversations();
  }

  async loadAllConversations(): Promise<void> {
    try {
      // Referenz zur gesamten Sammlung `direct_messages`
      const messagesCollectionRef = collection(this.firestore, 'direct_messages');

      // Abrufen aller Dokumente innerhalb der Sammlung
      const querySnapshot = await getDocs(messagesCollectionRef);

      let userConversationCount = 0; // Variable zum Zählen der Konversationen des aktuellen Benutzers
      let unreadMessagesCount = 0;

      // Durchlaufe jedes Dokument in der Sammlung
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const conversations = data['conversation'] || []; // Falls keine Konversationen vorhanden sind, leeres Array verwenden

        // Filtere Konversationen, bei denen der `currentUserUid` der Empfänger ist
        const userConversations = conversations.filter((conv: any) =>
          conv.receiverId === this.currentUserUid && conv.readedMessage === false
        );

        // Addiere die Anzahl der ungelesenen Konversationen des aktuellen Benutzers
        unreadMessagesCount += userConversations.length;

        // Speichere alle Nachrichten
        this.directMessages.push({ messageId: doc.id, ...data } as DirectMessage);

        // Wenn der Sender eine ungelesene Nachricht an den aktuellen Benutzer geschickt hat
        const senderConversations = conversations.filter((conv: any) =>
          conv.senderId === this.currentUserUid && conv.readedMessage === false
        );

        // Falls ungelesene Nachrichten des Senders existieren
        if (senderConversations.length > 0) {
          // Setze für den Sender den Badge (z.B. um anzuzeigen, dass es ungelesene Nachrichten gibt)
          // Für jeden Sender können wir hier eine Zählung der ungelesenen Nachrichten vornehmen
          // Dies könnte in einer zusätzlichen Eigenschaft für den Sender gespeichert werden
          this.unreadMessagesCount += senderConversations.length;
        }
      });

      // Wenn ungelesene Nachrichten vorhanden sind, setze `isUnread` auf true
      this.isUnread = unreadMessagesCount > 0;

      console.log(`Anzahl der ungelesenen Nachrichten: ${this.unreadMessagesCount}`);

    } catch (error) {
      console.error('Fehler beim Laden der Konversationen:', error);
    }
  }




  async loadData(user: FirebaseUser) {
    this.currentUserUid = user.uid; // Setze die currentUserUid hier
    await this.loadUsers();
    await this.channelsService.loadChannels(user.uid);
    // console.log(user.uid);
  }



  async loadUsers() {
    let usersRef = collection(this.firestore, 'users');
    let usersQuery = query(usersRef, orderBy('name'));

    onSnapshot(usersQuery, async (snapshot) => {
      this.users = await Promise.all(snapshot.docs.map(async (doc) => {
        let userData = doc.data() as User;
        return { ...userData, id: doc.id };
      }));
      // this.loadCurrentUser(currentUserId);
    });
  }

  // loadCurrentUser(currentUserId: string) {
  //   this.currentUser = this.users.find(user => user.id === currentUserId);
  //   console.log(this.currentUser)
  // }

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
    this.openChannelEvent.emit();
    if (this.currentUserUid) {
      this.messagesService.loadMessages(this.currentUserUid, channel.id);
    } else {
      console.error("currentUserUid is null");
    }
  }


  // helper method to toggle the clickContainer method
  openDialog() {
    this.dialog.open(CreateNewChannelDialog, {
      disableClose: false,
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });
  }

  clickUserContainer(user: User, i: number) {
    this.clickedUsers.fill(false);
    this.clickedChannels.fill(false);
    this.clickedUsers[i] = true;
    this.messagesService.getUserName(user);
    this.clickUserEvent.emit();
    if (this.currentUserUid) {
      this.messagesService.loadDirectMessages(this.currentUserUid, user.id);
      this.chatUtilityService.setMessageId(null);
    } else {


      console.error("currentUserUid is null");
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



}