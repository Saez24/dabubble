import { NgClass, NgFor, NgStyle } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { AvatarsService } from '../../../shared/services/avatars/avatars.service';
import { CreateAccountComponent } from '../create-account.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { UserService } from '../../../shared/services/firestore/user-service/user.service';

@Component({
  selector: 'app-select-avatar',
  standalone: true,
  imports: [MatCardModule, NgFor, MatButtonModule, NgClass, NgStyle, MatIconModule, CreateAccountComponent],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class SelectAvatarComponent implements OnInit {
  userName: string = '';
  email: string = '';
  password: string = '';
  avatars: string[] = [];
  selectedAvatar: string | null = null;
  avatarSelected = false;

  constructor(private _location: Location, private avatarsService: AvatarsService, private route: ActivatedRoute, private auth: Auth, private userService: UserService, private router: Router) {
    this.avatars = this.avatarsService.getAvatars();
    this.shuffleAvatars();
  }

  ngOnInit(): void {
    this.userName = this.route.snapshot.queryParamMap.get('name') || 'No Name Provided';
    this.email = this.route.snapshot.queryParamMap.get('email') || 'No Email Provided';
    this.password = this.route.snapshot.queryParamMap.get('password') || 'No Password Provided';
    console.log(this.userName);
    console.log(this.email);
    console.log(this.password);
  }

  chooseAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    this.avatarSelected = true;
  }

  shuffleAvatars() {
    for (let i = this.avatars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.avatars[i], this.avatars[j]] = [this.avatars[j], this.avatars[i]];
    }
  }

  goBack() {
    this._location.back();
  }

  finishCreateAccount() {
    const user = this.auth.currentUser;

    if (user && this.selectedAvatar) {
      const firestoreUser = {
        avatarPath: this.selectedAvatar,
        name: this.userName,
      };

      // Benutzer-Dokument in Firestore aktualisieren
      this.userService.updateUserInFirestore(user.uid, firestoreUser)
        .then(() => {
          console.log('Avatar successfully updated in Firestore');
          this.router.navigate(['sign-in']);
        })
        .catch((error) => {
          console.error('Error updating avatar in Firestore:', error.message);
        });
    } else {
      console.error('No user is logged in or avatar not selected');
    }
  }


  // createAccount() {
  //   if (this.email && this.password) {
  //     createUserWithEmailAndPassword(this.auth, this.email, this.password)
  //       .then((userCredential) => {
  //         const user = userCredential.user;

  //         // Benutzerdaten mit Avatar vorbereiten
  //         const firestoreUser = {
  //           uid: user.uid,
  //           email: user.email,
  //           name: this.userName,
  //           avatarPath: this.selectedAvatar
  //         };

  //         // Speichert den Benutzer in Firestore
  //         this.userService.createFirestoreUser(firestoreUser)
  //           .then(() => {
  //             console.log('User successfully created in Firestore');
  //             this.router.navigate(['sign-in'])
  //           })
  //           .catch((error) => {
  //             console.error('Error creating user in Firestore:', error.message);
  //           });
  //       })
  //       .catch((error) => {
  //         console.error('Error creating account:', error.message);
  //       });
  //   }
  // }
}
