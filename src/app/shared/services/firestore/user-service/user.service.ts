// Service for all Functions related to the User Object in Firestore

import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { User } from '../../../models/user.class';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  user: User = new User();

  constructor(private firestore: Firestore) { }

  async updateUserLoginState(userId: string, loginState: string) {
    try {
          // Update the user login state in the database
    } catch (error) {
      console.error('Error updating user');
    }
  }
}
