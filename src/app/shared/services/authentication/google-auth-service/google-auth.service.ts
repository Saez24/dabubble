import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  auth = inject(Auth);
  router = inject(Router);
  provider = new GoogleAuthProvider();

  constructor() {}

  async googleLogin(): Promise<void> {
    try {
      await signInWithRedirect(this.auth, this.provider);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }

  async googlePopupLogin(): Promise<void> {
    try {
      let result = await signInWithPopup(this.auth, this.provider);
      if (result.user) {
        this.router.navigateByUrl('board');
        console.log('Loged In as:', result.user.displayName, result.user.email);
      }
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }

  // async getRedirectIntel(): Promise<void> {
  //   try {
  //     let result = await getRedirectResult(this.auth);
  //     if (result?.user) {
  //       this.router.navigateByUrl('board');        
  //     }
  //   } catch (err: any) {
  //     console.error(err);
  //     throw err;
  //   }
  // }
}