import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { UserCredential } from "firebase/auth";
import { UserService } from '../../firestore/user-service/user.service';
import { Auth } from '@angular/fire/auth';
import { User } from '../../../models/user.class';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  auth = getAuth();
  router = inject(Router);
  userService = inject(UserService);
  currentUser: User | null = null; // Change to hold an instance of the User class

  constructor() {
    console.log(this.currentUser);
  }

  async login(email: string, password: string): Promise<void> {
    try {
      let result: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.userService.updateUserLoginState(result.user.uid, 'loggedIn');

      if (result.user) {
        // Create an instance of the User class and populate it with data from Firebase
        this.currentUser = new User({
          id: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          avatarPath: '', // This would be populated from your storage if needed
          loginState: 'loggedIn',
          channels: [] // Fetch channels from your userService if required
        });

        console.log('Auth.service: logged in as: ', this.currentUser.id);
        this.router.navigateByUrl('board');
      }
    } catch (err: any) {
      throw err;
    }
  }

  async logout(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser; // Still use Firebase's auth state for logging out

      if (currentUser) {
        await this.userService.updateUserLoginState(currentUser.uid, 'loggedOut');
        await signOut(this.auth);
        console.log(currentUser.uid);
        this.currentUser = null; // Clear the currentUser upon logout
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
