// Service for all Functions related to the Firestore Authentication of the User

import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword, signOut, updateProfile, createUserWithEmailAndPassword } from "firebase/auth";
import { UserCredential } from "firebase/auth";
import { UserService } from '../../firestore/user-service/user.service';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  auth = getAuth();
  router = inject(Router);
  userService = inject(UserService);

  constructor() { }


  async login(email: string, password: string): Promise<void> {
    try {
      let result: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.userService.updateUserLoginState(result.user.uid, 'loggedIn');
      if (result.user) {
        this.router.navigateByUrl('board');
      }
    } catch (err: any) {
      throw err;
    }
  }

  // async updateAuthUser() {
  //   const auth = getAuth();
  //   if (auth.currentUser) {
  //     updateProfile(auth.currentUser, {
  //       displayName: "Paul Scholz",
  //       photoURL: "../../assets/images/avatars/avatar2.svg",
  //     }).then(() => {
  //       // Profile updated!
  //       // ...
  //     }).catch((error) => {
  //       // An error occurred
  //       // ...
  //     });
  //   }
  // }


  async logout(): Promise<void> {
    try {
      if (this.auth.currentUser) {
        await this.userService.updateUserLoginState(this.auth.currentUser.uid, 'loggedOut');
        await signOut(this.auth);
        console.log(this.auth.currentUser.uid); // This will be null after signOut
      } else {
        console.log('No user is currently logged in.');
      }
      this.router.navigateByUrl('');
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }


  async guestLogin() {

  }


  async resetPassword() {

  }


  async sendPasswordResetMail() {

  }
}