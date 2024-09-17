// Service for all Functions related to the Firestore Authentication of the User

import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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
          console.log('Loged In as:');
          console.log('Name: ' + result.user.displayName);
          console.log('Email: ' + result.user.email);
          console.log('Avatar Path: ' + result.user.photoURL);
          console.log('UId: ' + result.user.uid);
        }
    } catch (err: any) {
      throw err;
    }
  }


  async logout() { 

  }


  async guestLogin() { 

  }


  async resetPassword() { 

  }


  async sendPasswordResetMail() { 

  }
}