import { Component, EventEmitter, inject, Input, Output, WritableSignal } from '@angular/core';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { User } from '../../shared/models/user.class';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss'
})
export class ProfileDialogComponent {
  @Input() currentUser!: WritableSignal<null | User | undefined>;
  @Output() editorOpen = new EventEmitter<boolean>();
  @Output() closeProfileDetail = new EventEmitter<boolean>();

  authService = inject(AuthService);
  userService = inject(UserService);

  readonly GUESTID = 'y7WnIAhufRhCn54XusoiYWlXl4S2';


  // openEditor(event: Event) {
  //   event.stopPropagation();
  //   this.editorOpen.emit(true);
  // }

  // closeProfile(event: Event) {
  //   event.stopPropagation();
  //   this.closeProfileDetail.emit(false);
  // }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }


  closeUserProfile() {
    this.userService.showProfile = false;
  }
  
}
