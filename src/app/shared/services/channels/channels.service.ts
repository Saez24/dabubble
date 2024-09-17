import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {

  channels: string[] = ['Entwicklerteam', 'Designteam', 'Marketingteam', 'Supportteam'];

  constructor() { }

  getChannels(): string[] {
    return this.channels;
  }
}
