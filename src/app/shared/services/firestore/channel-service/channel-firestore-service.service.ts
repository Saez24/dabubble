import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, where, query, doc, getDoc, updateDoc, setDoc } from '@angular/fire/firestore';
import { Observable, Subscription, of } from 'rxjs';
import { Channel } from '../../../models/channel.class';

@Injectable({
  providedIn: 'root'
})
export class ChannelFirebaseService {

  public channel: Channel = new Channel();
  public channel$!: Observable<Channel[]>;
  private subscription!: Subscription;

  constructor(private firestore: Firestore) { }

  async updateChannelDetails(channelId: string, details: Partial<Channel>) {
    try {
      let channelRef = this.getChannelDocReference(channelId);
      await updateDoc(channelRef, details);
    } catch (error) {
      console.error('Error updating channel details', error);
    }
  }

  getChannelDocReference(docId: string) {
    return doc(this.getChannelCollectionReference(), docId);
  }

  getChannelCollectionReference() {
    return collection(this.firestore, 'channels');
  }

  createFirestoreChannel(channel: Channel) {
    setDoc(doc(this.firestore, "channels", channel.id!.toString()), {
      name: channel.name,
      description: channel.description,
      users: channel.users,

    });
  }
}
