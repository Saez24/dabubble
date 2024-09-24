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
  showProfile: boolean = false;

  constructor(private firestore: Firestore) { }

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