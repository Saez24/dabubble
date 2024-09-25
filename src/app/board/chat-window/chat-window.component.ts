import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { Channel } from '../../shared/models/channel.class';
import { addDoc, collection, doc, Firestore, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';



@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, NgIf, NgFor],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class ChatWindowComponent implements OnInit, AfterViewChecked {
  messages: Message[] = [];
  users: User[] = [];
  channels: Channel[] = [];
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  chatMessage = '';
  messageArea = true;
  editedMessage = '';
  currentUserUid: string | null = null;
  editingMessageId: string | null = null;
  channelId: string | null = null;
  selectedChannelId: string | null = null;
  senderAvatar: string | null = null;
  senderName: string | null = null;


  @ViewChild('chatWindow') private chatWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth, private userService: UserService, private cd: ChangeDetectorRef, private authService: AuthService) { }

  ngOnInit() {
    this.getCurrentUser();
    this.loadChannels();
    this.loadMessages();
  }

  async getCurrentUser() {
    const currentUser = this.authService.currentUser;
    console.log('Aktueller Benutzer:', currentUser);

    if (currentUser && currentUser.id != null && currentUser.id != undefined) {
      this.currentUserUid = currentUser.id; // Speichere die aktuelle Benutzer-ID

      // Benutzerdaten von Firestore abrufen
      const userDoc = await this.userService.getUserById(currentUser.id);

      // Überprüfe, ob userDoc existiert und einen avatarPath hat
      if (userDoc) {
        this.senderAvatar = userDoc.avatarPath || './assets/images/avatars/default-avatar.svg'; // Standard-Avatar, wenn avatarPath nicht vorhanden ist
        this.senderName = userDoc.name; // Setze den Benutzernamen
      } else {
        console.warn('Benutzerdaten nicht gefunden für UID:', currentUser.id);
        this.senderAvatar = './assets/images/avatars/default-avatar.svg'; // Setze einen Standard-Avatar
      }

      console.log('User logged in: ', this.currentUserUid);
      console.log('Sender Avatar: ', this.senderAvatar);
      console.log(this.senderName);

    } else {
      console.log('Kein Benutzer angemeldet');
    }
  }


  async loadChannels() {
    const channelsRef = collection(this.firestore, 'channels');
    const channelsQuery = query(channelsRef);

    onSnapshot(channelsQuery, (snapshot) => {
      this.channels = snapshot.docs.map(doc => {
        const channelData = doc.data() as Channel;
        return { ...channelData, id: doc.id }; // ID nach channelData hinzufügen
      });
    });
  }

  getChannelName(channelId: string | null) {
    const channel = this.channels.find(c => c.id === channelId);

    if (channel) {
      this.selectedChannelId = channel.id; // Setze die selectedChannelId
      return channel.name;
    } else {
      this.selectedChannelId = null; // Setze die selectedChannelId auf null, wenn kein Kanal gefunden wird
      return 'Unbekannter Kanal';
    }
  }

  showEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  showMessageEditToggle() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage(docId: string) {
    this.editingMessageId = docId; // Verwende die Dokument-ID
    this.showMessageEditArea = true;
    this.showMessageEdit = false;
  }


  saveMessage(message: Message) {
    if (this.editingMessageId) { // Nutze die `editingMessageId` (Dokument-ID) anstelle von `message.messageId`
      const messageRef = doc(this.firestore, `messages/${this.editingMessageId}`); // Verweise auf die Dokument-ID

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

  isEditing(docId: string): boolean {
    return this.editingMessageId === docId; // Prüfe gegen die Firestore-Dokument-ID
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

  @Output() showThreadEvent = new EventEmitter<Message>();
  showThread(message: Message) {
    this.showThreadEvent.emit(message);
  }

  showError() {
    console.error("Kein Kanal ausgewählt.");
  }

  async sendMessage() {
    if (!this.selectedChannelId) {
      this.showError(); // Fehler, wenn kein Kanal ausgewählt ist
      return;
    }

    if (this.chatMessage.trim()) {
      const currentUser = this.authService.currentUser;

      if (currentUser) {
        const messagesRef = collection(this.firestore, 'messages');

        const newMessage: Message = new Message({
          senderID: currentUser.id,
          senderName: this.senderName,
          message: this.chatMessage,
          channelId: this.selectedChannelId, // Verwende die gespeicherte channelId
          reaction: '',
          answers: [],
        });

        await addDoc(messagesRef, {
          senderID: newMessage.senderID,
          senderName: newMessage.senderName,
          message: newMessage.message,
          channelId: newMessage.channelId,
          reaction: newMessage.reaction,
          answers: newMessage.answers,
          timestamp: new Date(),
        });

        this.chatMessage = ''; // Eingabefeld leeren
        this.loadMessages(); // Nachrichten neu laden
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
        message.messageId = doc.id;

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
      this.scrollToBottom();
      this.cd.detectChanges();
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom(); // Stelle sicher, dass das Chat-Fenster nach jeder View-Änderung nach unten scrollt
  }

  scrollToBottom(): void {
    if (this.chatWindow) {
      try {
        this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scroll to bottom failed:', err);
      }
    }
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
