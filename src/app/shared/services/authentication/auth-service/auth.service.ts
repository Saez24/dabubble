import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword, signOut, updateEmail, updateProfile, verifyBeforeUpdateEmail } from "firebase/auth";
import { UserCredential } from "firebase/auth";
import { UserService } from '../../firestore/user-service/user.service';
import { Auth, user, User as AuthUser } from '@angular/fire/auth';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';
import { doc, Firestore, onSnapshot } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // auth = getAuth();
  auth = inject(Auth);
  router = inject(Router);
  userService = inject(UserService);
  private userSignal = signal<User | null | undefined>(undefined);
  private authSubscription: Subscription | null = null;
  errorCode: string | null = null
  currentUserUid: string | null = null;
  currentUser = this.getUserSignal(); // Change to hold an instance of the User class

  constructor(private firestore: Firestore) {
    this.initializeAuthState();
  }

  getCurrentUser() {
    const userId = this.currentUser()?.id;
    console.log('Current User Id: ', userId);
    console.log('Current User Avatar: ', this.currentUser()?.avatarPath);
    if (userId) {
      this.currentUserUid = userId;  // Speichere die aktuelle Benutzer-ID
      this.loadUserData(this.currentUserUid);
    } else {
      console.log('Kein Benutzer angemeldet');
    }
  }

  loadUserData(uid: string | null) {
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
        // this.currentUser = new User({
        //   id: uid,
        //   name: data.name,
        //   avatarPath: data.avatarPath,
        //   loginState: 'loggedIn', // Assuming the user is logged in
        //   channels: [] // Load channels if necessary
        // });
      } else {
        console.log('Kein Benutzerdokument gefunden');
      }
    });
  }

  getUserSignal() {
    return this.userSignal;
  }


  setUser(user: User | null | undefined) {
    this.userSignal.set(user);
  }


  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }


  initializeAuthState() {
    this.authSubscription = user(this.auth).subscribe((authUser: AuthUser | null) => {
      if (authUser) {
        let currentUser = this.setCurrentUserObject(authUser);
        this.setUser(currentUser);
      } else {
        this.setUser(null);
      }
    })
  }


  setCurrentUserObject(user: AuthUser): User {
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      avatarPath: user.photoURL,
      loginState: 'loggedIn',
      channels: [] // Fetch channels from your userService if required
    } as User
  }


  async login(email: string, password: string): Promise<void> {
    try {
      let result: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.userService.updateUserLoginState(result.user.uid, 'loggedIn');
      this.router.navigateByUrl('board');
    }
    catch (err: any) {
      throw err;
    }
  }


  async logout(): Promise<void> {
    try {
      if (this.auth.currentUser) {
        await this.userService.updateUserLoginState(this.auth.currentUser.uid, 'loggedOut');
        await signOut(this.auth);
        window.open('sign-in', '_self');
      }
      else {
        console.log('No user is currently logged in');
      }
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


  async updateUserProfile(changes: {}): Promise<void> {
    try {
      if (this.auth.currentUser) {
        await updateProfile(this.auth.currentUser, changes);
      }
    } catch (err: any) {

      this.errorCode = err.code;
      console.error('Error while updating auth user profile', err.code);
      throw err;
    }
  }

  async updateEmail(email: string): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        await verifyBeforeUpdateEmail(currentUser, email);
        console.log('Email to confirm your new Email is send. This could take some Minutes');
        
      }
    } catch (err: any) {
      if (err.code == 'auth/requires-recent-login') {
        this.errorCode = err.code;
      } else {
        console.error('Error while updating auth user email', err.code);
        throw err;
      }
    }
  }
}
