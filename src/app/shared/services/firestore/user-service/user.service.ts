// Service for all Functions related to the User Object in Firestore

import { Injectable, signal } from '@angular/core';
import { Firestore, collection, doc, getDoc, updateDoc, setDoc, query, orderBy, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.class';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public user: User = new User();
  public user$!: Observable<User[]>;
  private userSignal = signal<User | null | undefined>(undefined);
  public currentUser = this.getUserSignal(); // Change to hold an instance of the User class
  public currentUserID: string | null = null;
  showProfile = signal<boolean>(false);
  showProfileEditor = signal<boolean>(false);
  showOverlay = signal<boolean>(false);
  users: User[] = [];
  selectedUser: User | null = null;
  selectedUserId: string = '';

  constructor(private firestore: Firestore) {
  }

  async loadUsers() {
    let usersRef = collection(this.firestore, 'users');
    let usersQuery = query(usersRef, orderBy('name'));

    onSnapshot(usersQuery, async (snapshot) => {
      this.users = await Promise.all(snapshot.docs.map(async (doc) => {
        let userData = doc.data() as User;
        console.log(this.users);
        return { ...userData, id: doc.id };
      }));

    });
  }

  getUserSignal() {
    return this.userSignal;
  }


  setUser(user: User | null | undefined) {
    this.userSignal.set(user);
  }


  updateUserInFirestore(uid: string, data: any) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return updateDoc(userDocRef, data);  // Aktualisiert das Benutzer-Dokument
  }


  async updateUserLoginState(userId: string, loginState: string) {
    try {
      let userRef = this.getUserDocReference(userId);
      await updateDoc(userRef, { loginState: loginState });
    } catch (error) {
      console.error('Error updating user', error);
    }
  }


  async updateUserDoc(userId: string, newUser: User) {
    try {
      let userRef = this.getUserDocReference(userId);
      await updateDoc(userRef, { ...newUser });
    } catch (error) {

    }
  }


  getUserDocReference(docId: string) {
    return doc(this.getUserCollectionReference(), docId)
  }


  getUserCollectionReference() {
    return collection(this.firestore, 'users');
  }


  createFirestoreUser(user: any): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    return setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: user.name,
      avatarPath: user.avatarPath,
      loginState: 'loggedOut', // Leerer loginState
      channels: [],
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    const userRef = this.getUserDocReference(userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return new User({ ...userDoc.data(), id: userDoc.id });
    } else {
      return null;
    }
  }


  showUserProfile(selectedUser: string | null) {
    console.log('selectedUser: ', selectedUser);
  }

}