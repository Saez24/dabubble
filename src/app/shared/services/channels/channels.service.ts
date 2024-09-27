import { Injectable } from '@angular/core';
import { Firestore, doc, onSnapshot, collection, query, orderBy } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { Channel } from '../../models/channel.class';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  
  clickedChannels: boolean[] = [];
  clickedUsers: boolean[] = [];
  name: string | null = null;
  public channels: Channel[] = [];
  public currentUserChannels: Channel[] = [];

  constructor(private firestore: Firestore, private auth: Auth) { }

  loadChannels(currentUserId: string) {
    let channelsRef = collection(this.firestore, 'channels');
    let channelsQuery = query(channelsRef, orderBy('name'));
  
    onSnapshot(channelsQuery, async (snapshot) => {
      this.channels = await Promise.all(snapshot.docs.map(async (doc) => {
        let channelData = doc.data() as Channel;
        return { ...channelData, id: doc.id };
      }));
  
      if (currentUserId) {
        let userChannels = this.channels.filter(channel => {
          return channel.members && channel.members.includes(currentUserId);
        });
        this.currentUserChannels = userChannels;
      } else {
        this.currentUserChannels = [];
      }
    });
  }

  showChannelName(name: string) {
    this.name = name;
    console.log(this.name);
  }

  clickChannelContainer(i: number) {
    this.clickedChannels.fill(false);
    this.clickedUsers.fill(false);
    this.clickedChannels[i] = true;
  }

  clickUserContainer(i: number) {
    this.clickedUsers.fill(false);
    this.clickedChannels.fill(false);
    this.clickedUsers[i] = true;
  }

  clickContainer(name: string, i: number, type: 'channel' | 'user') {
    if (type === 'channel') {
      this.clickChannelContainer(i);
      this.showChannelName(name);
    } else if (type === 'user') {
      this.clickUserContainer(i);
    }
  }

  initializeArrays(channelCount: number, userCount: number) {
    this.clickedChannels = new Array(channelCount).fill(false);
    this.clickedUsers = new Array(userCount).fill(false);
  }



  // checkAuthState(): void {
  //   this.auth.onAuthStateChanged((user: User | null) => {
  //     if (user) {
  //       this.currentUserUid = user.uid;
  //       this.getUserChannels(user.uid);
  //     } else {
  //       console.log('Kein Benutzer angemeldet');
  //     }
  //   });
  // }

  // getCurrentUser(): string | null {
  //   const currentUser = this.auth.currentUser;
  //   if (currentUser) {
  //     this.currentUserUid = currentUser.uid;
  //     return currentUser.uid;
  //   } else {
  //     console.log('Kein Benutzer angemeldet');
  //     return null;
  //   }
  // }

  // getUserChannels(uid: string): void {
  //   const userDocRef = doc(this.firestore, `users/${uid}`);
  //   onSnapshot(userDocRef, (doc) => {
  //     if (doc.exists()) {
  //       const data = doc.data() as { channels: string[] };
  //       this.currentUserChannels = data.channels;
  //       console.log('Benutzerinformationen:', this.currentUserChannels);
  //     } else {
  //       console.log('Kein Benutzerdokument gefunden');
  //     }
  //   });
  // }

  // async loadChannels(): Promise<Channel[]> {
  //   const channelsRef = collection(this.firestore, 'channels');
  //   const channelsQuery = query(channelsRef, orderBy('name'));

  //   return new Promise((resolve) => {
  //     onSnapshot(channelsQuery, (snapshot) => {
  //       const channels = snapshot.docs.map((doc) => {
  //         const channelData = doc.data() as Channel;
  //         return { ...channelData, id: doc.id };
  //       });
  //       resolve(channels);
  //     });
  //   });
  // }

//   async loadUsers(): Promise<User[]> {
//     const usersRef = collection(this.firestore, 'users');
//     const usersQuery = query(usersRef, orderBy('name'));

//     return new Promise((resolve) => {
//       onSnapshot(usersQuery, (snapshot) => {
//         const users = snapshot.docs.map((doc) => {
//           const userData = doc.data() as User;
//           return { ...userData, id: doc.id };
//         });
//         resolve(users);
//       });
//     });
//   }
}





