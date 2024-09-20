// Service for all Functions related to the User Object in Firestore

import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, where, query, doc, getDoc, updateDoc, setDoc } from '@angular/fire/firestore';
import { Observable, Subscription, of } from 'rxjs';
import { User } from '../../../models/user.class';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public user: User = new User();
  public user$!: Observable<User[]>;
  private subscription!: Subscription;

  constructor(private firestore: Firestore) { }

  async updateUserLoginState(userId: string, loginState: string) {
    try {
      let userRef = this.getUserDocReference(userId);
      await updateDoc(userRef, { loginState: loginState });
    } catch (error) {
      console.error('Error updating user', error);
    }
  }


  getUserDocReference(docId: string) {
    return doc(this.getUserCollectionReference(), docId)
  }


  getUserCollectionReference() {
    return collection(this.firestore, 'users');
  }


  createFirestoreUser(user: any) {
    setDoc(doc(this.firestore, "users", user.uid), {
      email: user.email,
      name: user.displayName,
      avatarPath: user.photoURL,
      id: user.uid,
      loginState: 'loggedOut',
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

}