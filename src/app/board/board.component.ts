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
import { ProfileDialogComponent } from '../dialogs/profile-dialog/profile-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../shared/services/authentication/auth-service/auth.service';
import { UserService } from '../shared/services/firestore/user-service/user.service';
import { IconsService } from '../shared/services/icons/icons.service';
import { doc, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Message } from '../shared/models/message.class';
import { Auth } from '@angular/fire/auth';
import { User } from '../shared/models/user.class';
import { AddPeopleDialog } from "../dialogs/create-new-channel-dialog/add-people-dialog/add-people-dialog.component";

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
    AddPeopleDialog
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
  showThreadComponent: boolean = false;
  currentUser: User | null = null;
  workspaceOpen = true;
  messages: Message[] = [];
  currentUserUid: string | null = null;
  selectedMessage: Message | null = null;
  showOverlay: boolean = false;


  constructor(private iconsService: IconsService, private firestore: Firestore, private auth: Auth,) { }


  ngOnInit() {
    this.getCurrentUser();
  }

  getCurrentUser() {
    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.id != null && currentUser.id != undefined) {
      this.currentUserUid = currentUser.id;  // Speichere die aktuelle Benutzer-ID
      console.log('User logged in: ', this.currentUserUid);
      this.loadUserData(currentUser.id!);
    } else {
      console.log('Kein Benutzer angemeldet');
    }
  }

  loadUserData(uid: string) {
    if (!uid) {
      console.log('Keine Benutzer-ID gefunden');
      return;
    }

    const userDocRef = doc(this.firestore, `users/${uid}`);
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as {
          name: string;
          avatarPath: string;
        };

        // Update currentUser with Firestore data
        this.currentUser = new User({
          id: uid,
          name: data.name,
          avatarPath: data.avatarPath,
          loginState: 'loggedIn', // Assuming the user is logged in
          channels: [] // Load channels if necessary
        });
      } else {
        console.log('Kein Benutzerdokument gefunden');
      }
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
    this.showOverlay = !this.showOverlay;
  }


  openUserProfile() {
    this.userService.showProfile = true;
  }

}