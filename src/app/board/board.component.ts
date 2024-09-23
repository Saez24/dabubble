import { Component, ViewChild, ViewEncapsulation, inject } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { ProfileDialogComponent } from '../dialogs/profile-dialog/profile-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../shared/services/authentication/auth-service/auth.service';
import { UserService } from '../shared/services/firestore/user-service/user.service';
import { IconsService } from '../shared/services/icons/icons.service';
import { collection, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Message } from '../shared/models/message.class';
import { Auth } from '@angular/fire/auth';

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
    ProfileDialogComponent
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss', '../../styles.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BoardComponent {

  @ViewChild('drawer') drawer!: MatDrawer;

  authService = inject(AuthService);
  userService = inject(UserService);
  searchInput: string = '';
  showThreadComponent: boolean = true;
  currentUser = this.authService.auth.currentUser;
  workspaceOpen = true;
  messages: Message[] = [];
  currentUserUid: string | null = null;
  selectedMessage: Message | null = null;
  showOverlay: boolean = false;

  constructor(private iconsService: IconsService, private firestore: Firestore, private auth: Auth, public dialog: MatDialog,) { }


  ngOnInit() {
    this.getCurrentUser();
  }

  getCurrentUser() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.currentUserUid = currentUser.uid;  // Speichere die aktuelle Benutzer-ID
    } else {
      console.log('Kein Benutzer angemeldet');
    }
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


  toggleUserMenu() {
    this.showOverlay = !this.showOverlay;
  }


  openUserProfile() {
    this.userService.showProfile = true;
    // this.dialog.open(ProfileDialogComponent);
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

}