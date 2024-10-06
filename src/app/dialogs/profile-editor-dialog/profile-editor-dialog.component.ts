import { Component, inject, Input, signal, WritableSignal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { User } from '../../shared/models/user.class';

@Component({
  selector: 'app-profile-editor-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile-editor-dialog.component.html',
  styleUrl: './profile-editor-dialog.component.scss'
})
export class ProfileEditorDialogComponent {
  // @Input() currentUser!: WritableSignal<User | null | undefined>;

  fullname: string | null | undefined;
  mail: string | null | undefined;
  avatarPath: string | null | undefined;
  changesSuccessful = signal<boolean>(false);

  authService = inject(AuthService);
  userService = inject(UserService);


  constructor() {
  }

  ngOnInit() {
    if (this.authService.currentUser()) {
      this.fullname = this.authService.currentUser()?.name;
      this.mail = this.authService.currentUser()?.email;
    }
    console.log(this.mail);
    console.log(this.fullname);
  }
    
    


  async onSubmit(ngForm: NgForm): Promise<void> {
    if (ngForm.submitted && ngForm.form.valid) {
      if (this.authService.currentUser()) {
        let updatedUser = this.getUpdatedUser();
        await this.authService.updateUserProfile({ displayName: this.fullname, photoURL: 'https://firebasestorage.googleapis.com/v0/b/dabubble-effe4.appspot.com/o/avatar_images%2Fcustom%2F1727618738594_Profil.jpg?alt=media&token=acc9532b-3254-4356-93d4-0009374ed845' });
        await this.authService.updateEmail(this.mail!);
        console.log(updatedUser!.id!);
        
        await this.userService.updateUserDoc(updatedUser!.id!, updatedUser!)
        this.authService.currentUser.set(updatedUser)
        this.changesSuccessful.set(true);

        console.log(this.mail);
        console.log(this.fullname);
      }
    }
  }


  getUpdatedUser(): User | undefined {
    if (this.authService.currentUser()) {
      return {
        ...this.authService.currentUser(),
        name: this.fullname!,
        email: this.mail!,
        avatarPath: this.avatarPath!
      } as User
    } else {
      return;
    }
  }


  stopPropagation(event: Event) {
    event.stopPropagation();
  }


  closeUserProfileEditor() {
    this.userService.showProfileEditor.set(false);
    this.userService.showProfile.set(true);
  }
}
