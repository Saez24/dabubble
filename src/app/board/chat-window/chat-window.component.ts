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

  constructor(private firestore: Firestore, private auth: Auth) { }

  ngOnInit() {
    this.loadMessages();
  }

  getCurrentUser() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.currentUserUid = currentUser.uid;  // Speichere die aktuelle Benutzer-ID
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

    onSnapshot(messagesQuery, (snapshot) => {
      this.messages = snapshot.docs.map(doc => {
        const message = doc.data() as Message;
        message.isOwnMessage = message.senderID === this.currentUserUid;

        // Füge das formatierte Datum zur Nachricht hinzu
        message.formattedTimestamp = this.formatTimestamp(message.timestamp);
        return message;
      });
    });
  }

  // Funktion zur Formatierung des Timestamps
  formatTimestamp(timestamp: any): string {
    const messageDate = new Date(timestamp.seconds * 1000); // Firebase timestamp konvertieren
    const today = new Date();

    // Prüfen, ob das Datum heute ist
    const isToday = messageDate.toDateString() === today.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
        messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}
