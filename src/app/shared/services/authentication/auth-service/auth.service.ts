// Service for all Functions related to the Firestore Authentication of the User

import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
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
  currentUser = this.auth.currentUser;

  constructor() { 
    console.log(this.currentUser);
  }


  async login(email: string, password: string): Promise<void> {
    try {
      let result: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.userService.updateUserLoginState(result.user.uid, 'loggedIn');
      if (result.user) {
        this.currentUser = result.user;
        console.log('Auth.service: logged in as: ', this.currentUser.uid);
        this.router.navigateByUrl('board');
      }
    } catch (err: any) {
      throw err;
    }
  }


  async logout(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser; // Speichere den aktuellen Benutzer vor dem SignOut
      if (currentUser) {
        await this.userService.updateUserLoginState(currentUser.uid, 'loggedOut');
        await signOut(this.auth);
        console.log(currentUser.uid); // Verwende den gespeicherten Benutzer, anstatt auf this.auth.currentUser zuzugreifen
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