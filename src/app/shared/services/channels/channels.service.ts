import { Injectable } from '@angular/core';
import { Firestore, doc, onSnapshot, collection, query, orderBy } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { Channel } from '../../models/channel.class';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  currentUserUid: string | null = null;
  currentUserChannels: string[] = [];

  constructor(private firestore: Firestore, private auth: Auth) {}

  checkAuthState(): void {
    this.auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        this.currentUserUid = user.uid;
        this.getUserChannels(user.uid);
      } else {
        console.log('Kein Benutzer angemeldet');
      }
    });
  }

  getCurrentUser(): string | null {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.currentUserUid = currentUser.uid;
      return currentUser.uid;
    } else {
      console.log('Kein Benutzer angemeldet');
      return null;
    }
  }

  getUserChannels(uid: string): void {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as { channels: string[] };
        this.currentUserChannels = data.channels;
        console.log('Benutzerinformationen:', this.currentUserChannels);
      } else {
        console.log('Kein Benutzerdokument gefunden');
      }
    });
  }

  async loadChannels(): Promise<Channel[]> {
    const channelsRef = collection(this.firestore, 'channels');
    const channelsQuery = query(channelsRef, orderBy('name'));

    return new Promise((resolve) => {
      onSnapshot(channelsQuery, (snapshot) => {
        const channels = snapshot.docs.map((doc) => {
          const channelData = doc.data() as Channel;
          return { ...channelData, id: doc.id };
        });
        resolve(channels);
      });
    });
  }

  async loadUsers(): Promise<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const usersQuery = query(usersRef, orderBy('name'));

    return new Promise((resolve) => {
      onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map((doc) => {
          const userData = doc.data() as User;
          return { ...userData, id: doc.id };
        });
        resolve(users);
      });
    });
  }
}












// import { Injectable } from '@angular/core';
// import { Channel } from '../../models/channel.class';
// import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy } from '@angular/fire/firestore';

// @Injectable({
//   providedIn: 'root'
// })
// export class ChannelsService {

//   newChannelName: string = '';
//   newChannelDescription: string = '';

//   constructor(private firestore: Firestore) { }

//   async sendChannel() {
//     const channelsRef = collection(this.firestore, 'channels');
//     const newChannelRef = doc(channelsRef);

//     const newChannel: Channel = new Channel({
//         id: newChannelRef.id,
//         name: this.newChannelName,
//         description: this.newChannelDescription,
//         users: [],
//     });

//     await addDoc(channelsRef, {
//         id: newChannel.id,
//         name: newChannel.name,
//         description: newChannel.description,
//         users: newChannel.users,
//     });

//     console.log("Channel erstellt");
// } 
// }
