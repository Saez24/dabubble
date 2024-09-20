import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Message } from '../../shared/models/message.class';
import { User } from '../../shared/models/user.class';
import { Channel } from '../../shared/models/channel.class';
import { addDoc, collection, doc, Firestore, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../../shared/services/firestore/user-service/user.service';



@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, NgIf],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ChatWindowComponent implements OnInit {
  messages: Message[] = [];
  users: User[] = [];
  channels: Channel[] = [];
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  chatMessage = '';
  messageArea = true;
  message = 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Facilis minus quae, natus asperiores, rem ipsa delectus dolorem iste soluta, repudiandae esse? Magnam facilis distinctio illo, fuga nisi suscipit perspiciatis iure.';
  editedMessage = '';
  currentUserUid: string | null = null;
  editingMessageId: string | null = null;

  constructor(private firestore: Firestore, private auth: Auth, private userService: UserService) { }

  ngOnInit() {
    this.getCurrentUser()
    this.loadMessages();
  }

  getCurrentUser() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.currentUserUid = currentUser.uid;
    } else {
      console.log('Kein Benutzer angemeldet');
    }
  }

  showEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  showMessageEditToggle() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage(messageId: string) {
    this.editingMessageId = messageId;
    this.showMessageEditArea = true;
  }

  saveMessage(message: Message) {
    if (message.messageId) { // Sicherstellen, dass die messageId existiert
      const messageRef = doc(this.firestore, `messages/${message.messageId}`);
      updateDoc(messageRef, { message: message.message }).then(() => {
        this.editingMessageId = null;
        this.showMessageEditArea = false;
      }).catch(error => {
        console.error("Fehler beim Speichern der Nachricht: ", error);
      });
    }
  }

  cancelMessageEdit() {
    this.editingMessageId = null;
    this.showMessageEditArea = false;
  }

  isEditing(messageId: string): boolean {
    return this.editingMessageId === messageId;
  }


  addEmoji(event: any) {
    this.chatMessage += event.emoji.native;
    console.log(event.emoji.native);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker && !target.closest('emoji-mart') && !target.closest('.message-icon')) {
      this.showEmojiPicker = false;
    }
  }

  @Output() showThreadEvent = new EventEmitter<void>();
  showThread() {
    this.showThreadEvent.emit();
  }

  async sendMessage() {
    if (this.chatMessage.trim()) {
      const currentUser = this.auth.currentUser;

      if (currentUser) {
        const messagesRef = collection(this.firestore, 'messages');

        const newMessageRef = doc(messagesRef);

        const newMessage: Message = new Message({
          messageId: newMessageRef.id,
          senderID: currentUser.uid,
          senderName: currentUser.displayName,
          message: this.chatMessage,
          reaction: '',
          answers: [],
        });

        await addDoc(messagesRef, {
          messageId: newMessage.messageId,
          senderID: newMessage.senderID,
          senderName: newMessage.senderName,
          message: newMessage.message,
          reaction: newMessage.reaction,
          answers: newMessage.answers,
          timestamp: new Date(),
        });

        console.log("Nachricht gesendet, lade Nachrichten neu.");

        this.chatMessage = ''; // Leere das Eingabefeld
        this.loadMessages(); // Lade Nachrichten neu
      } else {
        console.error('Kein Benutzer angemeldet');
      }
    }
  }

  async loadMessages() {
    const messagesRef = collection(this.firestore, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp'));

    onSnapshot(messagesQuery, async (snapshot) => {
      let lastDisplayedDate: string | null = null;

      this.messages = await Promise.all(snapshot.docs.map(async (doc) => {
        const messageData = doc.data();
        const message = new Message(messageData, this.currentUserUid);

        // Überprüfen, ob senderID nicht null ist
        if (message.senderID) {
          const senderUser = await this.userService.getUserById(message.senderID);
          // Setze den Avatar für die Nachricht oder einen Standard-Avatar, wenn kein Avatar verfügbar ist
          message.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
        } else {
          // Setze Standard-Avatar, wenn senderID null ist
          message.senderAvatar = './assets/images/avatars/avatar5.svg';
        }

        const messageTimestamp = messageData['timestamp'];
        const messageDate = new Date(messageTimestamp.seconds * 1000);
        const formattedDate = this.formatTimestamp(messageDate);

        if (formattedDate !== lastDisplayedDate) {
          message.displayDate = formattedDate;
          lastDisplayedDate = formattedDate;
        } else {
          message.displayDate = null;
        }

        message.formattedTimestamp = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return message;
      }));
    });
  }




  formatTimestamp(messageDate: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      return 'Heute'; // Wenn die Nachricht von heute ist
    } else if (isYesterday) {
      return 'Gestern'; // Wenn die Nachricht von gestern ist
    } else {
      // Format "13. September"
      return messageDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
    }
  }


}
