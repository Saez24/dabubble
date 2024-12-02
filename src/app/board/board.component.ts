import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation, WritableSignal, inject } from '@angular/core';
import { ChatWindowComponent } from "./chat-window/chat-window.component";
import { WorkspaceComponent } from "./workspace/workspace.component";
import { ThreadComponent } from './thread/thread.component';
import { CommonModule, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProfileDialogComponent } from '../dialogs/profile-dialog/profile-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../shared/services/authentication/auth-service/auth.service';
import { UserService } from '../shared/services/firestore/user-service/user.service';
import { IconsService } from '../shared/services/icons/icons.service';
import { collection, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Message } from '../shared/models/message.class';
import { Auth } from '@angular/fire/auth';
import { ProfileEditorDialogComponent } from "../dialogs/profile-editor-dialog/profile-editor-dialog.component";
import { DirectMessageComponent } from './chat-window/direct-message/direct-message/direct-message.component';
import { MessagesService } from '../shared/services/messages/messages.service';
import { ChannelMessageComponent } from './chat-window/channel-message/channel-message/channel-message.component';
import { User } from '../shared/models/user.class';
import { Channel } from '../shared/models/channel.class';
import { ChatUtilityService } from '../shared/services/messages/chat-utility.service';
import { ChannelsService } from '../shared/services/channels/channels.service';
import { UserInfoDialogComponent } from "../dialogs/user-info-dialog/user-info-dialog.component";
import { SearchDialogComponent } from '../dialogs/search-dialog/search-dialog.component';
import { MembersDialogComponent } from '../dialogs/members-dialog/members-dialog.component';
import { AddMemberDialogComponent } from '../dialogs/add-member-dialog/add-member-dialog.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    ChatWindowComponent,
    WorkspaceComponent,
    MatButtonModule,
    MatSidenavModule,
    ThreadComponent,
    MatCardModule,
    MatIconModule,
    ChatWindowComponent,
    WorkspaceComponent,
    ThreadComponent,
    CommonModule,
    NgIf,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    ProfileDialogComponent,
    ProfileEditorDialogComponent,
    DirectMessageComponent,
    ChannelMessageComponent,
    UserInfoDialogComponent,
    SearchDialogComponent,
    MembersDialogComponent,
    AddMemberDialogComponent
],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss', '../../styles.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BoardComponent implements OnInit {

  @ViewChild('drawer') drawer!: MatDrawer;
  // @ViewChild(WorkspaceComponent) workspaceComponent!: WorkspaceComponent;
  users: User[] = [];
  channels: Channel[] = [];
  searchInput: string = '';
  showThreadComponent: boolean = false;
  currentUser = this.authService.getUserSignal();
  workspaceOpen = true;
  messages: Message[] = [];
  currentUserUid: string | null | undefined = null;
  selectedMessage: Message | null = null;



  constructor(
    private iconsService: IconsService,
    private firestore: Firestore,
    private auth: Auth,
    public authService: AuthService,
    public userService: UserService,
    public messageService: MessagesService,
    public chatUtilityService: ChatUtilityService,
    public cd: ChangeDetectorRef,
    public channelsService: ChannelsService
  ) {
    this.currentUser = this.authService.getUserSignal();
  }


  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.loadUsers(); // Warten auf das Laden der Benutzer
        // console.log('Users array in ngOnInit:', this.users); // Hier wird das Array korrekt angezeigt
        await this.loadChannels();
        // console.log('Channels array in ngOnInit:', this.channels);
      } else {
        console.log('Kein Benutzer angemeldet');
      }
    });
  }

  async loadUsers() {
    const usersRef = collection(this.firestore, 'users');
    const usersQuery = query(usersRef, orderBy('name'));

    return new Promise((resolve) => {
      onSnapshot(usersQuery, async (snapshot) => {
        this.users = await Promise.all(snapshot.docs.map(async (doc) => {
          const userData = doc.data() as User;
          return { ...userData, id: doc.id };
        }));
        resolve(this.users); // Promise auflösen
      });
    });
  }


  async loadChannels() {
    const channelRef = collection(this.firestore, 'channels');
    const channelQuery = query(channelRef, orderBy('name'));

    return new Promise((resolve) => {
      onSnapshot(channelQuery, async (snapshot) => {
        this.channels = await Promise.all(snapshot.docs.map(async (doc) => {
          const channelData = doc.data() as Channel;// Prüfen, ob Kanäle geladen werden
          return { ...channelData, id: doc.id };
        }));
        resolve(this.channels); // Promise auflösen
      });
    });
  }



  closeThread() {
    this.showThreadComponent = false;
    this.selectedMessage = null;
  }


  showThread(message: Message) {
    this.showThreadComponent = true;
    this.selectedMessage = message;
  }

  toggleWorkspace() {
    this.drawer.toggle();
    this.workspaceOpen = !this.workspaceOpen;
  }


  toggleProfileMenu() {
    this.userService.showOverlay.set(!this.userService.showOverlay());
  }

  openUserProfile(event: Event) {
    event.stopPropagation();
    this.userService.showProfile.set(true);
  }

  closeAllDialogs() {
    this.userService.showProfile.set(false);
  }

  closeUserInfoDialog() {
    this.userService.showUserInfo.set(false);
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  openChannelMessage() {
    this.chatUtilityService.openChannelMessage()
  }

  openChannelMessageFromChat(selectedChannel: Channel, index: number) {
    this.chatUtilityService.openChannelMessageFromChat(selectedChannel, index);

  }

  openDirectMessage() {
    this.chatUtilityService.openDirectMessage();
  }

  openDirectMessageFromChat(selectedUser: User, index: number) {
    this.chatUtilityService.openDirectMessageFromChat(selectedUser, index)
  }


  openChatWindow() {
    this.chatUtilityService.openChatWindow();
    this.chatUtilityService.setMessageId(null);
    this.chatUtilityService.directMessageUser = null;
  }

}