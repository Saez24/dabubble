import { Injectable } from '@angular/core';
import { Channel } from '../../models/channel.class';
import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {

  newChannelName: string = '';
  newChannelDescription: string = '';

  constructor(private firestore: Firestore) { }

  async sendChannel() {
    const channelsRef = collection(this.firestore, 'channels');
    const newChannelRef = doc(channelsRef);

    const newChannel: Channel = new Channel({
        id: newChannelRef.id,
        name: this.newChannelName,
        description: this.newChannelDescription,
        users: [],
    });

    await addDoc(channelsRef, {
        id: newChannel.id,
        name: newChannel.name,
        description: newChannel.description,
        users: newChannel.users,
    });

    console.log("Channel erstellt");
} 






























  // // Method to create a new channel
  // setChannelNameAndDescription(channel: Channel) {
  //   this.currentChannel = new Channel(channel);
  //   this.channels.push(this.currentChannel);
  // }

  // // Method to return the current channel
  // getCurrentChannel(): Channel | null {
  //   return this.currentChannel;
  // }

  // // Method to add additional data to the current channel
  // updateCurrentChannelUsers(users: string[]) {
  //   let currentChannel = this.getCurrentChannel();
  //   if (currentChannel) {
  //     currentChannel.users = users;
  //   }
  // }

  // // // Method to find a channel by its id
  // // getChannelById(id: number): Channel | undefined {
  // //   return this.channels.find(channel => channel.id === id);
  // // }

  // // Method to return all channels
  // getChannelData(): Channel[] {
  //   return this.channels;
  // }
}
