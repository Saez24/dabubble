import { Injectable } from '@angular/core';
import { Channel } from '../../models/channel.class';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {

  channels: Channel[] = [];
  private nextId: number = 1;

  // Methode, um einen neuen Kanal zu erstellen
  setChannelData(name: string, description: string) {
    let newChannel = new Channel(this.nextId++, name, description);
    this.channels.push(newChannel);
  }

  // Methode, um einen Kanal durch ID zu finden
  getChannelById(id: number): Channel | undefined {
    return this.channels.find(channel => channel.id === id);
  }

  // Methode, um alle Kanäle zurückzugeben
  getChannelData(): Channel[] {
    return this.channels;
  }

  // // Methode, um zusätzliche Daten zu einem spezifischen Kanal hinzuzufügen
  // addAdditionalDataToChannel(id: number, additionalData: string) {
  //   let channel = this.getChannelById(id);
  //   if (channel) {
  //     channel.messages.push(additionalData); // Beispiel: zusätzliche Daten zu den Nachrichten hinzufügen
  //   }
  // }
}
