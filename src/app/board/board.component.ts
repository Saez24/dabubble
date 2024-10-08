import { Component, OnInit, ViewChild, ViewEncapsulation, WritableSignal, inject } from '@angular/core';
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
import { Firestore } from '@angular/fire/firestore';
import { Message } from '../shared/models/message.class';
import { Auth } from '@angular/fire/auth';
import { AddPeopleDialog } from "../dialogs/create-new-channel-dialog/add-people-dialog/add-people-dialog.component";
import { ProfileEditorDialogComponent } from "../dialogs/profile-editor-dialog/profile-editor-dialog.component";
import { DirectMessageComponent } from './chat-window/direct-message/direct-message/direct-message.component';
import { MessagesService } from '../shared/services/messages/messages.service';
import { ChannelMessageComponent } from './chat-window/channel-message/channel-message/channel-message.component';

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
    AddPeopleDialog,
    ProfileEditorDialogComponent,
    DirectMessageComponent,
    ChannelMessageComponent
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss', '../../styles.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BoardComponent implements OnInit {

  @ViewChild('drawer') drawer!: MatDrawer;

  searchInput: string = '';
  showThreadComponent: boolean = false;
  currentUser = this.authService.getUserSignal();
  workspaceOpen = true;
  messages: Message[] = [];
  currentUserUid: string | null | undefined = null;
  selectedMessage: Message | null = null;
  showChatWindow: boolean = false;
  showChannelMessage: boolean = true;
  showDirectMessage: boolean = false;


  constructor(
    private iconsService: IconsService,
    private firestore: Firestore,
    private auth: Auth,
    public authService: AuthService,
    public userService: UserService,
    public messageService: MessagesService
  ) {
    this.currentUser = this.authService.getUserSignal();
  }


  ngOnInit() {
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


  stopPropagation(event: Event) {
    event.stopPropagation();
  }


  openChannelMessage() {
    this.showChannelMessage = true;
    this.showDirectMessage = false;
    this.showChatWindow = false;
  }

  openDirectMessage() {
    this.showDirectMessage = true;
    this.showChannelMessage = false;
    this.showChatWindow = false;
  }

  openChatWindow() {
    this.showChatWindow = true;
    this.showDirectMessage = false;
    this.showChannelMessage = false;
    this.messageService.setMessageId(null);
    this.messageService.directMessageUser = null;
  }

}