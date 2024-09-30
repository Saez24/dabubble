import { Injectable, OnInit } from '@angular/core';
import { Firestore, doc, onSnapshot, collection, query, orderBy } from '@angular/fire/firestore';
import { Channel } from '../../models/channel.class';
import { User } from '../../models/user.class';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService implements OnInit {

  clickedChannels: boolean[] = [];
  clickedUsers: boolean[] = [];
  currentChannelName: string = 'Kein Kanal ausgewählt';
  currentChannelDescription: string = 'Keine Kanalbeschreibung vorhanden';
  currentChannelAuthor: string = '';
  currentChannelId: string = 'oDNFiWQQEhlM1XJVsyQ6';
  currentChannelMemberUids: string[] = [];
  currentChannelMembers: string[] | any;
  userName: string = '';
  channel: Channel | [] = [];
  public channels: Channel[] = [];
  public currentUserChannels: Channel[] = [];

  constructor(private firestore: Firestore) {

  }

  ngOnInit(): void {
  }

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
          return channel.memberUids && channel.memberUids.includes(currentUserId);
        });
        this.currentUserChannels = userChannels;
      } else {
        this.currentUserChannels = [];
      }
    });
  }

  getChannelData(channel: Channel) {
    this.currentChannelName = channel.name;
    this.currentChannelDescription = channel.description;
    this.currentChannelAuthor = channel.channelAuthor;
    this.currentChannelId = channel.id;
    this.currentChannelMemberUids = channel.memberUids;
    this.currentChannelMembers = channel.members;
    this.channel = channel;
    console.log(this.channel);
  }

  clickChannelContainer(channel: Channel, i: number) {
    this.clickedChannels.fill(false);
    this.clickedUsers.fill(false);
    this.clickedChannels[i] = true;
    this.getChannelData(channel);
  }

  initializeArrays(channelCount: number, userCount: number) {
    this.clickedChannels = new Array(channelCount).fill(false);
    this.clickedUsers = new Array(userCount).fill(false);
  }

  // needs to be moved to workspace

  getUserName(user: User) {
    this.userName = user.name;
    console.log(this.userName);
  }

  clickUserContainer(user: User, i: number) {
    this.clickedUsers.fill(false);
    this.clickedChannels.fill(false);
    this.clickedUsers[i] = true;
    this.getUserName(user);
  }

  //



  // async loadUsers() {
  //   let usersRef = collection(this.firestore, 'users');
  //   let usersQuery = query(usersRef, orderBy('name'));

  //   onSnapshot(usersQuery, async (snapshot) => {
  //     this.users = await Promise.all(snapshot.docs.map(async (doc) => {
  //       let userData = doc.data() as User;
  //       return { ...userData, id: doc.id };
  //     }));
  //   });
  //   console.log(this.users);
  // }



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





