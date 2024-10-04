
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { addDoc, collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { UploadFileService } from '../../shared/services/firestore/storage-service/upload-file.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { arrayUnion, getDoc } from 'firebase/firestore';



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
  messages: Message[] = [];
  users: User[] = [];
  currentUser = this.authService.getUserSignal();
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  threadMessage = '';
  currentUserUid: string | null = null;
  editingMessageId: string | null = null;
  senderAvatar: string | null = null;
  senderName: string | null = null;
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;
  @Input() selectedMessage: Message | null = null;
  reactions: { emoji: string, senderName: string, count: number }[] = [];
  selectedMessageId: string | null = null;
  originalMessage: string | null = null; // Ursprüngliche Nachricht speichern



  @ViewChild('cthreadWindow') private threadWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth, private userService: UserService, private cd: ChangeDetectorRef, private authService: AuthService, private uploadFileService: UploadFileService) { }
  ngOnInit() {
    this.getCurrentUser();
    this.loadMessages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMessage'] && this.selectedMessage) {
      this.loadMessages();
    }
  }

  @Output() closeThreadEvent = new EventEmitter<void>();
  closeThread() {
    this.closeThreadEvent.emit();
  }

  getCurrentUser() {
    const userId = this.currentUser()?.id;
    console.log('Current User Id: ', userId);
    console.log('Current User Avatar: ', this.currentUser()?.avatarPath);
    if (userId) {
      this.currentUserUid = userId;  // Speichere die aktuelle Benutzer-ID
      this.loadUserData(this.currentUserUid);
    } else {
      console.log('Kein Benutzer angemeldet');
    }
  }

  loadUserData(uid: string | null) {
    if (!uid) return;

    const userDocRef = doc(this.firestore, `users/${uid}`);
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as { name: string; avatarPath: string; };
        this.senderName = data.name; // Sendername setzen
        this.senderAvatar = data.avatarPath;
      } else {
        console.log('Kein Benutzerdokument gefunden');
      }
    });
  }

  showMessageEditToggle() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage(docId: string, message: Message) {
    this.editingMessageId = docId;
    this.originalMessage = message.message;
    this.showMessageEditArea = true;
    this.showMessageEdit = false;
  }

  async saveMessage(message: Message) {
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
          console.log('Antwort erfolgreich aktualisiert');
          this.resetEditState();
        } else {
          console.error('Antwort nicht gefunden');
        }
      } else {
        console.error('Hauptnachricht nicht gefunden');
      }
    }
  }

  cancelMessageEdit(message: Message) {
    // Nachricht auf den ursprünglichen Wert zurücksetzen
    if (this.originalMessage !== null) {
      message.message = this.originalMessage;
    }
    this.resetEditState();
  }

  resetEditState() {
    this.editingMessageId = null;
    this.showMessageEditArea = false;
    this.originalMessage = null;
  }

  isEditing(docId: string): boolean {
    return this.editingMessageId === docId;
  }

  showEmoji(messageId: string) {
    this.selectedMessageId = messageId;
    this.showEmojiPicker = true;
  }

  addEmoji(event: any) {
    const emoji = event.emoji.native;

    // Überprüfen, ob eine Nachricht bearbeitet wird
    if (this.selectedMessageId && this.isEditing(this.selectedMessageId)) {
      // Nachricht finden, die bearbeitet wird
      const messageToUpdate = this.messages.find(
        (msg) => msg.messageId === this.selectedMessageId
      );

      if (messageToUpdate) {
        // Emoji in das bearbeitete Textfeld einfügen
        messageToUpdate.message += emoji;
      } else {
        console.error('Zu bearbeitende Nachricht nicht gefunden.');
      }
    } else if (this.selectedMessageId !== this.threadMessage) {
      const messageToUpdate = this.findMessageToUpdate();

      if (!messageToUpdate) {
        console.error('Nachricht nicht gefunden oder keine gültige Nachricht ausgewählt.');
        return;
      }
      this.addOrUpdateReaction(messageToUpdate, emoji);
      this.updateMessageReactions(messageToUpdate);

    } else {
      this.threadMessage += emoji;
    }
    this.showEmojiPicker = false;
  }


  private findMessageToUpdate(): Message | null {
    let messageToUpdate = this.messages.find(msg => msg.messageId === this.selectedMessageId) || null;
    if (!messageToUpdate) {
      messageToUpdate = this.selectedMessage || null;
    }
    return messageToUpdate;
  }

  private addOrUpdateReaction(message: Message, emoji: string): void {
    const existingReaction = message.reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      existingReaction.count += 1;
    } else {
      message.reactions.push({
        emoji: emoji,
        senderName: this.senderName || '',
        count: 1
      });
    }

    console.log('Updated reactions:', message.reactions);
  }


  async updateMessageReactions(message: Message) {
    const messageRef = doc(this.firestore, `messages/${message.messageId}`);
    console.log('Updating reactions for messageId:', message.messageId, 'with reactions:', message.reactions);

    try {
      await updateDoc(messageRef, {
        reactions: message.reactions
      });
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Reaktionen: ", error);
    }
  }




  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker) {
      if (!target.closest('.emoji-box') && !target.closest('.message-icon') && !target.closest('.thread-message-icon')) {
        console.log('Closing emoji picker');
        this.showEmojiPicker = false;
      } else {
        console.log('Clicked inside emoji box or icon');
      }
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
    if (this.threadMessage.trim() || this.selectedFile) {
      const currentUser = this.authService.currentUser;

      if (currentUser()) {
        const newMessageId = doc(collection(this.firestore, 'messages')).id;
        // Prüfe, ob es sich um eine Antwort handelt
        const newMessage: Message = new Message({
          senderID: this.currentUserUid,
          senderName: this.senderName,
          message: this.threadMessage,
          reactions: [], // Leeres Array für Reaktionen
          parentMessageId: this.selectedMessage ? this.selectedMessage.messageId : null,
          fileURL: '',
          messageId: newMessageId
        });

        if (this.selectedMessage) {
          // Speichere die Antwort im answers-Array der ausgewählten Nachricht
          await this.saveMessageToDatabase(newMessage, this.selectedMessage);
        } else {
          // Ansonsten erstelle eine neue Nachricht in der messages-Sammlung
          const messagesRef = collection(this.firestore, 'messages');
          const messageDocRef = await addDoc(messagesRef, {
            senderID: newMessage.senderID,
            senderName: newMessage.senderName,
            message: newMessage.message,
            reactions: newMessage.reactions, // Füge leeres Array hinzu
            parentMessageId: newMessage.parentMessageId,
            timestamp: new Date(),
          });

          // Datei-Upload, falls vorhanden
          if (this.selectedFile && this.currentUserUid) {
            try {
              const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, messageDocRef.id);
              newMessage.fileURL = fileURL;
              await updateDoc(messageDocRef, { fileURL: newMessage.fileURL });
            } catch (error) {
              console.error('Datei-Upload fehlgeschlagen:', error);
            }
          }
        }

        // Leere das Eingabefeld und setze die ausgewählte Datei zurück
        this.threadMessage = '';
        this.selectedFile = null;
        this.loadMessages();
        this.scrollToBottom();
        this.deleteUpload();
      } else {
        console.error('Kein Benutzer angemeldet');
      }
    }
  }


  async saveMessageToDatabase(message: Message, selectedMessage: Message) {
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

  async loadMessages() {
    if (!this.selectedMessage) {
      this.messages = []; // Wenn keine Nachricht ausgewählt ist, leere die Nachrichten
      return;
    }

    const messageRef = doc(this.firestore, 'messages', this.selectedMessage.messageId);
    const messageSnap = await getDoc(messageRef);

    if (messageSnap.exists()) {
      const selectedMessageData = messageSnap.data();
      const answers = selectedMessageData['answers'] || []; // Verwende Index-Signatur für den Zugriff

      // Lade nur die Nachrichten, die im answers-Array sind
      this.messages = await Promise.all(answers.map(async (answer: any) => {
        const message = new Message(answer, this.currentUserUid);

        if (message.senderID) {
          const senderUser = await this.userService.getUserById(message.senderID);
          message.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
        } else {
          message.senderAvatar = './assets/images/avatars/avatar5.svg'; // Standard-Avatar
        }

        const messageDate = new Date(answer.timestamp.seconds * 1000);
        message.formattedTimestamp = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return message;
      }));

      this.cd.detectChanges();
      this.scrollToBottom();
    } else {
      console.error('Ausgewählte Nachricht existiert nicht');
    }
  }

  scrollToBottom(): void {
    if (this.threadWindow) {
      try {
        this.threadWindow.nativeElement.scrollTop = this.threadWindow.nativeElement.scrollHeight;
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

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (file) {
      this.selectedFile = file; // Speichere die ausgewählte Datei

      // Datei als base64 speichern, um sie im localStorage zu speichern
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result as string;
        this.filePreviewUrl = fileData; // Speichere die Vorschau-URL für die Datei
        localStorage.setItem('selectedFile', JSON.stringify({ fileName: file.name, fileData }));
        console.log('File saved to localStorage');
      };
      reader.readAsDataURL(file);
    } else {
      console.error('No file selected');
    }
  }

  deleteUpload() {
    this.selectedFile = null;
    this.filePreviewUrl = null;
    localStorage.removeItem('selectedFile');
  }

  // Trigger für verstecktes File-Input
  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  isImageFile(fileURL: string | null): boolean {
    if (!fileURL) return false;

    // Extrahiere die Datei-Informationen aus der Firebase-URL und prüfe den Dateinamen
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    const url = new URL(fileURL);
    const fileName = url.pathname.split('/').pop(); // Hole den Dateinamen aus dem Pfad

    if (!fileName) return false;

    // Prüfe, ob der Dateiname mit einem der Bildformate endet
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(fileExtension || '');
  }

  getFileNameFromURL(url: string | null): string {
    if (!url) {
      return 'Datei'; // Fallback, falls die URL null ist
    }

    const decodedUrl = decodeURIComponent(url);
    const fileName = decodedUrl.split('?')[0].split('/').pop();
    return fileName || 'Datei'; // Wenn kein Dateiname gefunden wird, 'Datei' als Fallback anzeigen
  }
}