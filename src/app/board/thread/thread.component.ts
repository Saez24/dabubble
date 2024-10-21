import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Message } from '../../shared/models/message.class';
import { User } from '../../shared/models/user.class';
import { collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { UploadFileService } from '../../shared/services/firestore/storage-service/upload-file.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { arrayUnion, getDoc } from 'firebase/firestore';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { Channel } from '../../shared/models/channel.class';
import { SendMessageService } from '../../shared/services/messages/send-message.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, NgIf, NgFor, SafeUrlPipe],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class ThreadComponent implements OnInit {
  @HostListener('document:click', ['$event'])
  @Output() showThreadEvent = new EventEmitter<Message>();
  @Output() closeThreadEvent = new EventEmitter<void>();
  @Input() selectedMessage: Message | null = null;

  messages: Message[] = [];
  users: User[] = [];
  channels: Channel[] = [];
  currentUser = this.authService.getUserSignal();
  currentUserUid: string | null = null;
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  editingMessageId: string | null = null;
  editingMessage: string | null = null;
  typedMessage = '';
  senderAvatar: string | null = null;
  senderName: string | null = null;
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;
  reactions: { emoji: string, senderName: string, count: number }[] = [];
  selectedMessageId: string | null = null;
  
  constructor(private firestore: Firestore, private auth: Auth, private userService: UserService, private cd: ChangeDetectorRef, private authService: AuthService, private uploadFileService: UploadFileService, public channelsService: ChannelsService, public sendMessageService: SendMessageService) { }
  
  ngOnInit() {
    this.getCurrentUser();
    this.loadMessages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMessage'] && this.selectedMessage) {
      this.loadMessages();
    }
  }

  closeThread() {
    this.closeThreadEvent.emit();
  }

  getCurrentUser() {
    const userId = this.currentUser()?.id;
    if (userId) {
      this.currentUserUid = userId;
      this.loadUserData(this.currentUserUid);
    } 
  }

  loadUserData(uid: string | null) {
    if (!uid) return;
    const userDocRef = doc(this.firestore, `users/${uid}`);
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as { name: string; avatarPath: string; };
        this.senderName = data.name;
        this.senderAvatar = data.avatarPath;
      } 
    });
  }
  

//LOAD MESSAGES!!!!!!!!!!!!!!

async loadMessages() {
  if (!this.selectedMessage) {
    this.messages = [];
    return;
  }

  const messageRef = doc(this.firestore, 'messages', this.selectedMessage.messageId);
  const messageSnap = await getDoc(messageRef);

  if (messageSnap.exists()) {
    const selectedMessageData = messageSnap.data();
    const answers = selectedMessageData['answers'] || [];
    this.selectedMessage.isOwnMessage = this.selectedMessage.senderID === this.currentUserUid;

    this.messages = await Promise.all(
      answers.map((answer: any) => this.checkLoadMessagesDetails(answer))
    );
    this.cd.detectChanges();
  } 
}

private async checkLoadMessagesDetails(answer: any): Promise<Message> {
  const message = new Message(answer, this.currentUserUid);

  if (message.senderID) {
    const senderUser = await this.userService.getUserById(message.senderID);
    message.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
  } else {
    message.senderAvatar = './assets/images/avatars/avatar5.svg';
  }

  const messageDate = new Date(answer.timestamp.seconds * 1000);
  message.formattedTimestamp = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return message;
}


//EDITING!!!!!!!!!!

  toggleEditBtn() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  isEditing(docId: string): boolean {
    return this.editingMessageId === docId;
  }

  enableEditMode(docId: string, message: Message) {
    this.editingMessageId = docId;
    this.editingMessage = message.message;
    this.showMessageEditArea = true;
    this.showMessageEdit = false;
  }

  cancelEditMode(message: Message) {
    if (this.editingMessage !== null) {
      message.message = this.editingMessage;
    }
    this.resetEditState();
  }

  resetEditState() {
    this.editingMessageId = null;
    this.editingMessage = null;
    this.showMessageEditArea = false;
  }

  async saveEditedMessage(message: Message) {
    if (this.editingMessageId && this.selectedMessage) {
      const messageRef = doc(this.firestore, `messages/${this.selectedMessage.messageId}`);
      const docSnap = await getDoc(messageRef);

      if (docSnap.exists()) {
        const mainMessage = docSnap.data();
        const answers = mainMessage['answers'] || [];
        const answerToUpdate = answers.find((answer: any) => answer.messageId === this.editingMessageId);

        if (answerToUpdate) {
          answerToUpdate.message = message.message;
          await updateDoc(messageRef, { answers });
          this.resetEditState();
          this.cd.detectChanges(); 
        } 
      } 
    }
  }


//EMOJIS & REACTIONS!!!!!!!!!!!!!

  showEmoji(messageId: string) {
    this.selectedMessageId = messageId;
    this.showEmojiPicker = true;
  }

  addEmoji(event: any): void {
    const emoji = event.emoji.native;
  
    if (this.selectedMessageId && this.isEditing(this.selectedMessageId)) {
      this.appendEmojiToEditedMessage(emoji);
    } else if (this.selectedMessageId !== this.typedMessage) {
      const messageToUpdate = this.findMessageToUpdate();
  
      if (!messageToUpdate) {
        return;
      }
      this.addOrUpdateReaction(messageToUpdate, emoji); 
      this.updateMessageReactions(messageToUpdate);
  
    } else {
      this.typedMessage += emoji;
    }
  
    this.showEmojiPicker = false;
  }
  
  private appendEmojiToEditedMessage(emoji: string): void {
    const messageToUpdate = this.messages.find((msg) => msg.messageId === this.selectedMessageId);
  
    if (messageToUpdate) {
      messageToUpdate.message += emoji;
    }
  }

  private findMessageToUpdate(): Message | null {
    let messageToUpdate = this.messages.find(msg => msg.messageId === this.selectedMessageId) || null;
    if (!messageToUpdate) {
      messageToUpdate = this.selectedMessage || null;
    }
    return messageToUpdate;
  }

  addOrUpdateReaction(message: Message, emoji: string): void {
    this.selectedMessageId = message.messageId;
    const senderName = this.senderName || '';
    const emojiReaction = message.reactions.find(r => r.emoji === emoji);
  
    if (emojiReaction) {
      const senderNames = emojiReaction.senderName.split(', ');
      const currentUserIndex = senderNames.indexOf(senderName);
  
      if (currentUserIndex > -1) {
        senderNames.splice(currentUserIndex, 1);
        emojiReaction.count -= 1;
  
        if (emojiReaction.count === 0) {
          const emojiIndex = message.reactions.indexOf(emojiReaction);
          message.reactions.splice(emojiIndex, 1);
        } else {
          emojiReaction.senderName = senderNames.join(', ');
        }
      } else {
        emojiReaction.count += 1;
        emojiReaction.senderName += (emojiReaction.senderName ? ', ' : '') + senderName;
      }
    } else {
      message.reactions.push({
        emoji: emoji,
        senderName: senderName,
        count: 1
      });
    }
    this.updateMessageReactions(message);
  }
   
  formatSenderNames(senderNames: string): string {
    const senderNameList = senderNames.split(', ');
    const currentUser = this.senderName || '';
    const formattedNames = senderNameList.map(name => name === currentUser ? 'Du' : name);
    
    if (formattedNames.length > 1) {
      const lastSender = formattedNames.pop();
      return formattedNames.join(', ') + ' und ' + lastSender;
    }
    return formattedNames[0];
  }
  
  getReactionVerb(senderNames: string): string {
    const senderNameList = senderNames.split(', ');
    const currentUser = this.senderName || '';
    const formattedNames = senderNameList.map(name => name === currentUser ? 'Du' : name);
  
    if (formattedNames.length === 1 && formattedNames[0] === 'Du') {
      return 'hast reagiert';
    }
    if (formattedNames.length === 1) {
      return 'hat reagiert';
    }
    return 'haben reagiert';
  }
  
  async updateMessageReactions(message: Message) {
    if (!this.selectedMessageId) {
       console.error('Fehlende selectedMessageId.');
       return;
    }
    try {
      const messageRef = doc(this.firestore, `messages/${this.selectedMessage?.messageId}`);
      const docSnap = await getDoc(messageRef);

      if (docSnap.exists()) {
        const mainMessage = docSnap.data();
        if (this.isMainMessage()) {
          await this.updateMainMessageReactions(message, mainMessage, messageRef);
        } else {
          await this.updateAnswerMessageReactions(message, mainMessage, messageRef);
        }
      } 
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Reaktionen: ", error);
    }
  }

  isMainMessage(): boolean {
    return this.selectedMessageId === this.selectedMessage?.messageId;
  }

  async updateMainMessageReactions(message: Message, mainMessage: any, messageRef: any) {
    mainMessage['reactions'] = message.reactions;

    await updateDoc(messageRef, {
      reactions: mainMessage['reactions']
    });
  }

  async updateAnswerMessageReactions(message: Message, mainMessage: any, messageRef: any) {
    const answers = mainMessage['answers'] || [];
    const answerToUpdate = answers.find((answer: any) => answer.messageId === this.selectedMessageId);

    if (answerToUpdate) {
      answerToUpdate['reactions'] = message.reactions;

      await updateDoc(messageRef, {
        answers: answers
      });
    } else {
      console.error('Keine passende Antwort gefunden, um die Reaktionen zu aktualisieren.');
    }
  }

  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker) {
      if (!target.closest('.emoji-box') && !target.closest('.message-icon') && !target.closest('.thread-message-icon')&& !target.closest('.emoji-btn')) {
        console.log('Closing emoji picker');
        this.showEmojiPicker = false;
      } else {
        console.log('Clicked inside emoji box or icon');
      }
    }
  }


  //CREATE MESSAGE!!!!!!!!!!!!!
  
  async sendMessage() {
    if (this.typedMessage.trim() || this.selectedFile) {
      const currentUser = this.authService.currentUser;
  
      if (currentUser()) {
        const newMessageId = doc(collection(this.firestore, 'messages')).id;
        const newMessage: Message = new Message({
          senderID: this.currentUserUid,
          senderName: this.senderName,
          message: this.typedMessage,
          reactions: [],
          parentMessageId: this.selectedMessage ? this.selectedMessage.messageId : null,
          fileURL: '',
          messageId: newMessageId
        });
  
        if (this.selectedMessage) {
          await this.uploadMessage(newMessage, this.selectedMessage);
        }
  
        await this.handleFileUpload(newMessage, newMessageId);
  
        this.typedMessage = '';
        this.selectedFile = null;
        this.loadMessages();
        this.sendMessageService.scrollToBottom();
        this.sendMessageService.deleteUpload();
      } else {
        console.error('Kein Benutzer angemeldet');
      }
    }
  }
  
  private async handleFileUpload(newMessage: Message, newMessageId: string) {
    if (this.selectedFile && this.currentUserUid) {
      try {
        const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, newMessageId);
        newMessage.fileURL = fileURL;
        await updateDoc(doc(this.firestore, 'messages', newMessageId), { fileURL: newMessage.fileURL });
      } catch (error) {
        console.error('Datei-Upload fehlgeschlagen:', error);
      }
    }
  }
  
  async uploadMessage(message: Message, selectedMessage: Message) {
    const messageRef = doc(this.firestore, 'messages', selectedMessage.messageId);

    await updateDoc(messageRef, {
      answers: arrayUnion({
        senderID: message.senderID,
        senderName: message.senderName,
        message: message.message,
        timestamp: new Date(),
        reactions: message.reactions,
        messageId: message.messageId
      })
    });
  }
}