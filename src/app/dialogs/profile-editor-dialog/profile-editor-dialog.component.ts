import { Component, EventEmitter, inject, Input, Output, WritableSignal } from '@angular/core';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { User } from '../../shared/models/user.class';

@Component({
  selector: 'app-profile-editor-dialog',
  standalone: true,
  imports: [],
  templateUrl: './profile-editor-dialog.component.html',
  styleUrl: './profile-editor-dialog.component.scss'
})
export class ProfileEditorDialogComponent {
  @Input() currentUser!: WritableSignal<User | null | undefined>;

  authService = inject(AuthService);
  userService = inject(UserService);

}
