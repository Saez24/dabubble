import { ChangeDetectionStrategy, Component, HostListener, ViewEncapsulation, EventEmitter, Output, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Message } from '../../shared/models/message.class';
import { User } from '../../shared/models/user.class';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { Auth } from '@angular/fire/auth';
import { addDoc, arrayUnion, collection, doc, onSnapshot, updateDoc, } from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';


@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, FormsModule, CommonModule, PickerComponent, NgIf, RouterModule,],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ThreadComponent implements OnInit, OnChanges {
  messages: Message[] = [];
  users: User[] = [];
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  threadMessageArea = true;
  threadMessage = '';
  newThreadMessage = '';
  editingMessage = '';
  currentUser: User | null = null;
  currentUserUid: string | null = null;
  @Input() selectedMessage: Message | null = null;

  constructor(private firestore: Firestore, private userService: UserService, private auth: Auth) { }
  ngOnInit(): void {
    this.getCurrentUser();
    this.loadMessages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMessage'] && this.selectedMessage) {
      this.loadMessages();
    }
  }

  getCurrentUser() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.currentUserUid = currentUser.uid;
    } else {
      console.log('Kein Benutzer angemeldet');
    }
  }

  sendMessage() {
    if (this.newThreadMessage.trim() && this.currentUserUid) {
      const currentUser = this.auth.currentUser;
      if (currentUser) {

        const message = new Message({
          senderID: currentUser.uid,
          senderName: currentUser.displayName,
          message: this.newThreadMessage,
          reaction: '',
          parentMessageId: this.selectedMessage ? this.selectedMessage.messageId : null
        });

        this.saveMessageToDatabase(message, this.selectedMessage);
        this.newThreadMessage = '';
      }
    }
  }

  async saveMessageToDatabase(message: Message, selectedMessage: Message | null) {
    if (selectedMessage) {
      const messageRef = doc(this.firestore, 'messages', selectedMessage.messageId);

      await updateDoc(messageRef, {
        answers: arrayUnion({
          senderID: message.senderID,
          senderName: message.senderName,
          message: message.message,
          timestamp: new Date(),
          isOwnMessage: true,
          reaction: '',
        })
      });
    }
  }

  loadMessages() {
    const messagesRef = collection(this.firestore, 'messages');
    onSnapshot(messagesRef, (snapshot) => {
      const allMessages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const formattedDate = this.formatFirebaseTimestamp(data['timestamp']);

        return new Message({
          messageId: doc.id,
          senderID: data['senderID'],
          senderName: data['senderName'],
          message: data['message'],
          reaction: data['reaction'],
          formattedTimestamp: formattedDate,
          parentMessageId: data['parentMessageId'],
          answers: data['answers'] || []
        }, this.currentUserUid);
      });

      if (this.selectedMessage) {
        const selectedMessage = allMessages.find(msg => msg.messageId === this.selectedMessage?.messageId);
        this.messages = selectedMessage ? selectedMessage.answers : [];
      } else {
        this.messages = [];
      }
      // console.log('Nachrichten erfolgreich geladen:', this.messages);
    }, (error) => {
      // console.error('Fehler beim Laden der Nachrichten:', error);
    });
  }


  formatFirebaseTimestamp(timestamp: { seconds: number; nanoseconds?: number }): string | null {
    if (!timestamp || typeof timestamp.seconds !== 'number') {
      return null;
    }

    const date = new Date(timestamp.seconds * 1000);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };

    return date.toLocaleString('de-DE', options);
  }

  @Output() closeThreadEvent = new EventEmitter<void>();
  closeThread() {
    this.closeThreadEvent.emit();
  }

  toggleEditBtn(message: Message) {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage(message: Message) {
    this.threadMessageArea = false;
    this.toggleEditBtn(message);
    this.showMessageEditArea = true;
    this.editingMessage = message.message || ''; // Fallback auf leeren String
  }

  async saveEditedMessage(message: Message) {
    if (this.selectedMessage) {
      const messageRef = doc(this.firestore, 'messages', this.selectedMessage.messageId);

      await updateDoc(messageRef, {
        answers: this.selectedMessage.answers.map((answer: any) =>
          answer.messageId === message.messageId ? { ...answer, message: this.editingMessage } : answer
        )
      });
    }
    this.showMessageEditArea = false;
    this.threadMessageArea = true;
  }

  cancelMessageEdit() {
    this.showMessageEditArea = false;
    this.threadMessageArea = true;
  }

  showEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any) {
    if (this.showMessageEditArea) {
      this.editingMessage += event.emoji.native;
    } else {
      this.newThreadMessage += event.emoji.native;
    }
    console.log(event.emoji.native);
  }


  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker && !target.closest('emoji-mart') && !target.closest('.thread-message-icon')) {
      this.showEmojiPicker = false;
    }
  }
}