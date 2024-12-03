import { Component } from '@angular/core';
import { EventEmitter, inject, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { ChatUtilityService } from '../../shared/services/messages/chat-utility.service';
import { MessagesService } from '../../shared/services/messages/messages.service';
import { User } from '../../shared/models/user.class';
import { Channel } from '../../shared/models/channel.class';
import { DirectMessage } from '../../shared/models/direct.message.class';
import { Message } from '../../shared/models/message.class';
import { Firestore } from '@angular/fire/firestore';



// type SearchItem = CurrentUser | PrivateChat | Channel | ChatMessage;
type SearchItem = User | DirectMessage | Channel | Message;

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss'
})
export class SearchDialogComponent implements OnChanges {
  @Input() searchValue!: any;
  @Output() sendEmptyString: EventEmitter<string> = new EventEmitter<string>();

  // boardServ = inject(BoardService);
  // firestore = inject(FirestoreService);
  // memberServ = inject(MemberDialogsService);

  chatUtilityService = inject(ChatUtilityService);
  authService = inject(AuthService);
  channelsService = inject(ChannelsService);
  userService = inject(UserService);
  messagesService = inject(MessagesService);
  currentUser = this.authService.getUserSignal();
  @Output() openChannelEvent = new EventEmitter<void>();

  showSearchDialog: boolean = false;
  mainSearchList: any[] = [];
  allData: (User | DirectMessage | Channel | Message)[] = [];

  ngOnInit() {  
    this.loadAllData();
  }


  async loadAllData() {
    this.authService.auth.onAuthStateChanged(async (user) => {
      this.allData = [];
      if (user) {
        let channels: Channel[] = await this.channelsService.loadChannelsAsPromise(user.uid);
        channels.forEach((channel: Channel) => { this.allData.push(channel) });
        let users: User[] = await this.userService.loadUsersAsPromise();
        users.forEach((user: User) => { this.allData.push(user) });
      }
    });
  }


  openUserProfile(event: Event) {
    event.stopPropagation();
    this.userService.showProfile.set(true);
    console.log('openUserProfile');
    
  }


  async getSelectedUserInfo(selectedUserId: string | null) {
    this.showSearchDialog = false;
    console.log('USER selected:', selectedUserId);
    this.userService.showUserInfo.set(true);
    await this.userService.getSelectedUserById(selectedUserId as string);
  }


  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      this.handleSearchChanges(changes);
    }, 100);
  }


  handleSearchChanges(changes: SimpleChanges): void {
    if (changes['searchValue'] && this.searchValue.length > 0) {
      this.showSearchDialogAndFilterItems();
    } else {
      this.hideSearchDialog();
    }
  }

  showSearchDialogAndFilterItems(): void {
    console.log('searchValue =', this.searchValue);
    console.log('allData =', this.allData);

    this.showSearchDialog = true;
    this.mainSearchList = this.filterSearchItems();

    console.log('result =', this.mainSearchList);
  }


  hideSearchDialog(): void {
    this.showSearchDialog = false;
  }


  openChannel(channel: Channel, i: number) {
    this.showSearchDialog = false;
    this.channelsService.channelIsClicked = true;
    this.channelsService.clickChannelContainer(channel, i);
    this.openChannelEvent.emit();
    if (this.authService.currentUserUid) {
      this.messagesService.loadMessages(this.authService.currentUserUid, channel.id);
    } else {
      console.error("FAIL!!!");
    }

    console.log('channel =', channel);
    
  }


  filterSearchItems(): SearchItem[] {


    return this.allData.filter((ad: SearchItem) => {
      if (this.isUser(ad)) {
        return ad.name.toLowerCase().includes(this.searchValue.toLowerCase());
      } else if (this.isChannel(ad)) {
        return ad.name.toLowerCase().includes(this.searchValue.toLowerCase());
      } else if (this.isChatMessage(ad)) {
        return ad.senderName!.toLowerCase().includes(this.searchValue.toLowerCase());
      } 
      // else if (this.DirectMessage(ad)) {
      //   return ad.senderName!.some((chat) => chat.message.toLowerCase().includes(this.searchValue.toLowerCase()))
      // } 
      else {
        return false
      }
    });
  }

  isUser(item: SearchItem): item is User {
    return (item as User).name !== undefined;
  }

  isChannel(item: SearchItem): item is Channel {
    return (item as Channel).name !== undefined;
  }

  isDirectMessage(item: SearchItem): item is DirectMessage {
    return (item as DirectMessage).senderName !== undefined;
  }

  isChatMessage(item: SearchItem): item is Message {
    return (item as Message).senderName !== undefined;
  }
}