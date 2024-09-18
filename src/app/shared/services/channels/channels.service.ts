import { Injectable } from '@angular/core';
import { Channel } from '../../models/channel.class';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {

  channel: Channel[] | any = [];
  channels = new Array<Channel>();

  constructor() {}

  // addChannel(channel: Channel) {
  //   this.channels.push(channel);
  //   console.log('Neuer Kanal hinzugefügt:', channel);
  // }

  getChannels(): Channel[] {
    return this.channel;
  }
}
