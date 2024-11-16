import { EventEmitter, Injectable } from '@angular/core';
import { Channel } from '../../models/channel.class';
import { User } from '../../models/user.class';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from '../firestore/user-service/user.service';

@Injectable({
  providedIn: 'root'
})
export class ChatUtilityService {
  users = this.userService.users;
  showChatWindow: boolean = false;
  showChannelMessage: boolean = true;
  showDirectMessage: boolean = false;
  directMessageUser: User | null = null;
  selectedChannel: Channel | null = null;
  messageIdSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  messageId$: Observable<string | null> = this.messageIdSubject.asObservable();
  selectedUser: User | null = null;

  public openDirectMessageEvent: EventEmitter<{ selectedUser: User, index: number }> = new EventEmitter();
  public openChannelMessageEvent: EventEmitter<{ selectedChannel: Channel, index: number }> = new EventEmitter();

  constructor(private userService: UserService,) { }

  openChannelMessage() {
    this.showChannelMessage = true;
    this.showDirectMessage = false;
    this.showChatWindow = false;
  }

  openChannelMessageFromChat(selectedChannel: Channel, index: number) {
    this.showChannelMessage = true;
    this.showDirectMessage = false;
    this.showChatWindow = false;
    this.openChannelMessageEvent.emit({ selectedChannel, index });
  }

  openDirectMessage() {
    this.showDirectMessage = true;
    this.showChannelMessage = false;
    this.showChatWindow = false;
  }

  openDirectMessageFromChat(selectedUser: User, index: number) {
    this.showDirectMessage = true;
    this.showChannelMessage = false;
    this.showChatWindow = false;
    this.openDirectMessageEvent.emit({ selectedUser, index });
  }

  openChatWindow() {
    this.showChatWindow = true;
    this.showDirectMessage = false;
    this.showChannelMessage = false;
    this.setMessageId(null);
    this.directMessageUser = null;
    this.selectedChannel = null;
    this.selectedUser = null;
    this.userService.selectedUser = null;
  }

  setMessageId(messageId: string | null) {
    this.messageIdSubject.next(messageId);
  }
}
