import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, inject, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { addDoc, collection, doc, Firestore, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { UploadFileService } from '../../shared/services/firestore/storage-service/upload-file.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { ChannelDescriptionDialogComponent } from '../../dialogs/channel-description-dialog/channel-description-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesService } from '../../shared/services/messages/messages.service';
import { AddMemberDialogComponent } from '../../dialogs/add-member-dialog/add-member-dialog.component';



@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, NgIf, NgFor, SafeUrlPipe, AddMemberDialogComponent],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})

export class ChatWindowComponent implements OnInit {
  messages = this.messageService.messages;
  users: User[] = [];
  channels: Channel[] = [];
  // currentUser = this.authService.getUserSignal();
  currentUser: User | any;
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  chatMessage = '';
  messageArea = true;
  editedMessage = '';
  currentUserUid: string | null = null;
  editingMessageId: string | null = null;
  senderAvatar: string | null = null;
  senderName: string | null = null;
  selectedFile: File | null = null;// Service für den Datei-Upload
  filePreviewUrl: string | null = null;


  @ViewChild('chatWindow') private chatWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth,
    private userService: UserService, private cd: ChangeDetectorRef,
    private authService: AuthService, private uploadFileService: UploadFileService,
    public channelsService: ChannelsService, public dialog: MatDialog, public messageService: MessagesService) { }

  ngOnInit() {
    // // Überprüfe, ob currentChannelId gesetzt ist
    // if (this.channelsService.currentChannelId) {
    //   this.messages = this.messageService.messages;
    //   this.messageService.loadMessages(this.channelsService.currentChannelId);
    //   this.scrollToBottom();
    //   this.cd.detectChanges();
    // }

    this.authService.getCurrentUser();
    this.loadData();
    this.loadUserData(this.currentUserUid);
  }

  async loadData() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUserUid = user.uid;
        this.loadUsers(this.currentUserUid);
        this.channelsService.loadChannels(this.currentUserUid);
      } else {
        console.log('Kein Benutzer angemeldet');
      }
    });
  }

  async loadUsers(currentUserId: string) {
    let usersRef = collection(this.firestore, 'users');
    let usersQuery = query(usersRef, orderBy('name'));

    onSnapshot(usersQuery, async (snapshot) => {
      this.users = await Promise.all(snapshot.docs.map(async (doc) => {
        let userData = doc.data() as User;
        return { ...userData, id: doc.id };
      }));
      this.loadCurrentUser(currentUserId);
    });
  }

  loadCurrentUser(currentUserId: string) {
    this.currentUser = this.users.find(user => user.id === currentUserId);
  }

  openChannelDescriptionDialog() {
    this.dialog.open(ChannelDescriptionDialogComponent)
  }

  openAddMemberDialog() {
    this.dialog.open(AddMemberDialogComponent)
  }

  loadUserData(uid: string | null) {
    this.authService.loadUserData(uid);
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
    if (!this.channelsService.currentChannelId) {
      this.showError(); // Fehler, wenn kein Kanal ausgewählt ist
      return;
    }

    if (this.chatMessage.trim() || this.selectedFile) {
      const currentUser = this.authService.currentUser;

      if (currentUser()) {
        const messagesRef = collection(this.firestore, 'messages');

        const newMessage: Message = new Message({
          senderID: this.currentUser.uid,
          senderName: this.currentUser.name,
          message: this.chatMessage,
          channelId: this.channelsService.currentChannelId, // Verwende die gespeicherte channelId
          reaction: '',
          answers: [],
          fileURL: '',
        });

        const messageDocRef = await addDoc(messagesRef, {
          senderID: newMessage.senderID,
          senderName: newMessage.senderName,
          message: newMessage.message,
          channelId: newMessage.channelId,
          reaction: newMessage.reaction,
          answers: newMessage.answers,
          timestamp: new Date(),
        });

        if (this.selectedFile && this.currentUserUid) {
          try {
            const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, messageDocRef.id); // Verwende die ID des neuen Dokuments
            newMessage.fileURL = fileURL; // Setze die Download-URL in der Nachricht
            await updateDoc(messageDocRef, { fileURL: newMessage.fileURL }); // Aktualisiere das Dokument mit der Datei-URL
          } catch (error) {
            console.error('Datei-Upload fehlgeschlagen:', error);
          }
        }

        this.chatMessage = ''; // Eingabefeld leeren
        this.selectedFile = null; // Reset selectedFile
        this.messageService.loadMessages(this.channelsService.currentChannelId); // Übergebe die channelId
        this.scrollToBottom();
        this.deleteUpload();
      } else {
        console.error('Kein Benutzer angemeldet');
      }
    }
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


  // async loadMessages(channelId: string) {
  //   const messagesRef = collection(this.firestore, 'messages');
  //   console.log(channelId);


  //   // Filtere die Nachrichten nach der übergebenen channelId
  //   const messagesQuery = query(
  //     messagesRef,
  //     where('channelId', '==', channelId), // Hier filtern wir nach channelId
  //     orderBy('timestamp')
  //   );

  //   onSnapshot(messagesQuery, async (snapshot) => {
  //     let lastDisplayedDate: string | null = null;

  //     this.messages = await Promise.all(snapshot.docs.map(async (doc) => {
  //       const messageData = doc.data();
  //       const message = new Message(messageData, this.currentUserUid);
  //       message.messageId = doc.id;

  //       // Überprüfen, ob senderID nicht null ist
  //       if (message.senderID) {
  //         const senderUser = await this.userService.getUserById(message.senderID);
  //         message.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
  //       } else {
  //         message.senderAvatar = './assets/images/avatars/avatar5.svg';
  //       }

  //       const messageTimestamp = messageData['timestamp'];
  //       const messageDate = new Date(messageTimestamp.seconds * 1000);
  //       const formattedDate = this.formatTimestamp(messageDate);

  //       if (formattedDate !== lastDisplayedDate) {
  //         message.displayDate = formattedDate;
  //         lastDisplayedDate = formattedDate;
  //       } else {
  //         message.displayDate = null;
  //       }

  //       message.formattedTimestamp = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  //       return message;
  //     }));

  //     this.cd.detectChanges();
  //     this.scrollToBottom();
  //   });
  // }

  // scrollToBottom(): void {
  //   if (this.chatWindow) {
  //     try {
  //       this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
  //     } catch (err) {
  //       console.error('Scroll to bottom failed:', err);
  //     }
  //   }
  // }

  // formatTimestamp(messageDate: Date): string {
  //   const today = new Date();
  //   const yesterday = new Date();
  //   yesterday.setDate(today.getDate() - 1);

  //   const isToday = messageDate.toDateString() === today.toDateString();
  //   const isYesterday = messageDate.toDateString() === yesterday.toDateString();

  //   if (isToday) {
  //     return 'Heute'; // Wenn die Nachricht von heute ist
  //   } else if (isYesterday) {
  //     return 'Gestern'; // Wenn die Nachricht von gestern ist
  //   } else {
  //     // Format "13. September"
  //     return messageDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  //   }
  // }

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

  // ngAfterViewChecked() {
  //   this.scrollToBottom(); // Stelle sicher, dass das Chat-Fenster nach jeder View-Änderung nach unten scrollt
  // }

  // async getCurrentUser() {
  //   const currentUser = this.authService.currentUser;

  //   if (currentUser && currentUser.id != null && currentUser.id != undefined) {
  //     this.currentUserUid = currentUser.id; // Speichere die aktuelle Benutzer-ID

  //     // Benutzerdaten von Firestore abrufen
  //     const userDoc = await this.userService.getUserById(currentUser.id);

  //     // Überprüfe, ob userDoc existiert und einen avatarPath hat
  //     if (userDoc) {
  //       this.senderAvatar = userDoc.avatarPath || './assets/images/avatars/default-avatar.svg'; // Standard-Avatar, wenn avatarPath nicht vorhanden ist
  //       this.senderName = userDoc.name; // Setze den Benutzernamen
  //     } else {
  //       console.warn('Benutzerdaten nicht gefunden für UID:', currentUser.id);
  //       this.senderAvatar = './assets/images/avatars/default-avatar.svg'; // Setze einen Standard-Avatar
  //     }

  //   } else {
  //     console.log('Kein Benutzer angemeldet');
  //   }
  // }

  // async loadChannels() {
  //   const channelsRef = collection(this.firestore, 'channels');
  //   const channelsQuery = query(channelsRef);

  //   onSnapshot(channelsQuery, (snapshot) => {
  //     this.channels = snapshot.docs.map(doc => {
  //       const channelData = doc.data() as Channel;
  //       return { ...channelData, id: doc.id }; // ID nach channelData hinzufügen
  //     });
  //   });
  // }

  // getChannelName(channelId: string | null) {
  //   const channel = this.channels.find(c => c.id === channelId);

  //   if (channel) {
  //     this.selectedChannelId = channel.id; // Setze die selectedChannelId
  //     return channel.name;
  //   } else {
  //     this.selectedChannelId = null; // Setze die selectedChannelId auf null, wenn kein Kanal gefunden wird
  //     return 'Unbekannter Kanal';
  //   }
  // }

}
