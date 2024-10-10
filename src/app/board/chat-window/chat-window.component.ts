import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { addDoc, arrayUnion, collection, doc, Firestore, getDocs, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { UserService } from '../../shared/services/firestore/user-service/user.service';
import { AuthService } from '../../shared/services/authentication/auth-service/auth.service';
import { UploadFileService } from '../../shared/services/firestore/storage-service/upload-file.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { ChannelsService } from '../../shared/services/channels/channels.service';
import { ChannelDescriptionDialogComponent } from '../../dialogs/channel-description-dialog/channel-description-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesService } from '../../shared/services/messages/messages.service';
import { AddMemberDialogComponent } from '../../dialogs/add-member-dialog/add-member-dialog.component';
import { DirectMessageComponent } from './direct-message/direct-message/direct-message.component';
import { ChannelMessageComponent } from './channel-message/channel-message/channel-message.component';
import { DirectMessage } from '../../shared/models/direct.message.class';
import { WorkspaceComponent } from '../workspace/workspace.component';



@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, NgIf, NgFor, SafeUrlPipe, AddMemberDialogComponent, DirectMessageComponent, ChannelMessageComponent],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})

export class ChatWindowComponent implements OnInit {
  messages = this.messageService.messages;
  users: User[] = [];
  channels: Channel[] = [];
  currentUser = this.authService.getUserSignal();
  showEmojiPicker = false;
  chatMessage = '';
  currentUserUid = '';
  senderAvatar: string | null = null;
  senderName: string | null = null;
  selectedFile: File | null = null;// Service für den Datei-Upload
  filePreviewUrl: string | null = null;
  searchQuery: string = '';
  filteredChannels: Channel[] = [];
  filteredUsers: User[] = [];
  isSearching: boolean = false;
  selectedUser = this.messageService.directMessageUser;
  selectedChannel = this.channelsService.currentChannelId;
  messageId: string | null = null;

  @Output() openDirectMessageEvent = new EventEmitter<void>();
  @Output() openChannelMessageEvent = new EventEmitter<void>();
  @Output() openDirectMessageFromChatEvent = new EventEmitter<{ selectedUser: User, index: number }>();
  @Output() openChannelMessageFromChatEvent = new EventEmitter<{ selectedChannel: Channel, index: number }>();
  @ViewChild('chatWindow') private chatWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth,
    private userService: UserService, private cd: ChangeDetectorRef,
    private authService: AuthService, private uploadFileService: UploadFileService,
    public channelsService: ChannelsService, public dialog: MatDialog, public messageService: MessagesService,) { }

  ngOnInit() {
    this.loadData();
  }

  openChannelDescriptionDialog() {
    this.dialog.open(ChannelDescriptionDialogComponent)
  }

  openAddMemberDialog() {
    this.dialog.open(AddMemberDialogComponent)
  }

  async onSearch(event: any) {
    this.searchQuery = event.target.value.trim().toLowerCase();
    this.isSearching = this.searchQuery.length > 0;

    if (this.searchQuery.startsWith('#')) {
      // Suche nach Channels
      this.filteredChannels = this.channels.filter(channel =>
        channel.name.toLowerCase().includes(this.searchQuery.slice(1))
      );
      this.filteredUsers = []; // User-Suchergebnisse leeren
    } else if (this.searchQuery.startsWith('@') || this.isValidEmail(this.searchQuery)) {
      // Suche nach Usern (nach @ oder E-Mail-Adresse)
      this.filteredUsers = this.users.filter(user =>
      (user.name.toLowerCase().includes(this.searchQuery.slice(1)) ||
        (user.email && user.email.toLowerCase().includes(this.searchQuery))) // Null-Prüfung für user.email
      );
      this.filteredChannels = []; // Channel-Suchergebnisse leeren
    } else {
      // Leere Ergebnisse, falls die Eingabe nicht passt
      this.filteredChannels = [];
      this.filteredUsers = [];
    }
  }

  isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  async loadData() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.loadUsers();
        this.loadChannels();
      } else {
        console.log('Kein Benutzer angemeldet');
      }
    });
  }

  async loadUsers() {
    let usersRef = collection(this.firestore, 'users');
    let usersQuery = query(usersRef, orderBy('name'));

    onSnapshot(usersQuery, async (snapshot) => {
      this.users = await Promise.all(snapshot.docs.map(async (doc) => {
        let userData = doc.data() as User;
        return { ...userData, id: doc.id };
      }));

    });
  }

  async loadChannels() {
    let channelRef = collection(this.firestore, 'channels');
    let channelQuery = query(channelRef, orderBy('name'));

    onSnapshot(channelQuery, async (snapshot) => {
      this.channels = await Promise.all(snapshot.docs.map(async (doc) => {
        let channelData = doc.data() as Channel;
        return { ...channelData, id: doc.id };
      }));

    });
  }

  showEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
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

  showError() {
    console.error("Kein Kanal ausgewählt.");
  }

  async checkExistingConversation(receiverId: string): Promise<string | null> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.error("Kein Benutzer angemeldet.");
      return null;
    }

    const senderId = currentUser()?.id; // aktuelle Benutzer-ID

    const messagesRef = collection(this.firestore, 'direct_messages');

    // Suche nach einer bestehenden Konversation zwischen dem aktuellen Benutzer und dem Empfänger
    const q = query(
      messagesRef,
      where('senderId', 'in', [senderId, receiverId]),
      where('receiverId', 'in', [senderId, receiverId])
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const messageDoc = querySnapshot.docs[0];
      return messageDoc.id; // Gibt die messageId der ersten gefundenen Konversation zurück
    }

    return null; // Keine bestehende Konversation gefunden
  }

  async sendMessage() {
    if (this.chatMessage.trim() || this.selectedFile) {
      const currentUser = this.authService.currentUser;

      if (currentUser()) {
        // console.log("Aktueller Benutzer:", currentUser()); // Überprüfen, ob der aktuelle Benutzer korrekt abgerufen wird

        // Überprüfe, ob ein Benutzer oder ein Kanal ausgewählt ist
        if (this.selectedUser?.id) {
          console.log("DirectMessageUser:", this.selectedUser.id); // Überprüfen, ob der Benutzer korrekt gesetzt ist
          this.messageId = await this.checkExistingConversation(this.selectedUser.id);

          // An einen Benutzer senden
          const messagesRef = collection(this.firestore, 'direct_messages');

          if (this.messageId) {
            // Konversation existiert, also aktualisiere sie
            const messageDocRef = doc(messagesRef, this.messageId);

            // Füge die neue Nachricht zur bestehenden Konversation hinzu
            await updateDoc(messageDocRef, {
              conversation: arrayUnion({
                senderName: currentUser()?.name,
                message: this.chatMessage,
                reaction: [],
                timestamp: new Date(),
                receiverName: this.selectedUser?.name, // Zugriff auf den Namen des ausgewählten Benutzers
                senderId: currentUser()?.id,
                receiverId: this.selectedUser?.id, // Zugriff auf die ID des ausgewählten Benutzers
              })
            });

            // Datei verarbeiten, falls vorhanden
            if (this.selectedFile && this.currentUserUid) {
              try {
                const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, messageDocRef.id);
                await updateDoc(messageDocRef, { fileURL });
              } catch (error) {
                console.error('Datei-Upload fehlgeschlagen:', error);
              }
            }
          } else {
            // Es gibt keine Konversation, also erstelle eine neue
            const newMessage: DirectMessage = new DirectMessage({
              conversation: [],
              senderId: currentUser()?.id,
              senderName: currentUser()?.name,
              message: this.chatMessage,
              reactions: [],
              fileURL: '',
              receiverId: this.selectedUser?.id, // Zugriff auf die ID des ausgewählten Benutzers
              receiverName: this.selectedUser?.name, // Zugriff auf den Namen des ausgewählten Benutzers
            });

            // Füge die neue Konversation in Firestore hinzu
            const messageDocRef = await addDoc(messagesRef, {
              senderId: newMessage.senderId,
              receiverId: newMessage.receiverId,
              timestamp: new Date(),
              conversation: [{
                senderName: newMessage.senderName,
                message: newMessage.message,
                reaction: newMessage.reactions,
                timestamp: new Date(),
                receiverName: newMessage.receiverName,
                senderId: newMessage.senderId,
                receiverId: newMessage.receiverId,
              }]
            });

            // Datei verarbeiten, falls vorhanden
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
          const userIndex = this.users.findIndex(user => user.id === this.selectedUser?.id); // Find the index of the selected user
          if (userIndex !== -1) {
            this.openDirectMessageFromChatEvent.emit({ selectedUser: this.selectedUser, index: userIndex });
          } else {
            console.error("Selected user not found in users array");
          }

        } else if (this.channelsService.currentChannelId) {
          // An einen Kanal senden
          const messagesRef = collection(this.firestore, 'messages');

          const newMessage: Message = new Message({
            senderID: currentUser()?.id,
            senderName: currentUser()?.name,
            message: this.chatMessage,
            channelId: this.channelsService.currentChannelId,
            reactions: [],
            answers: [],
            fileURL: '',
          });

          const messageDocRef = await addDoc(messagesRef, {
            senderID: newMessage.senderID,
            senderName: newMessage.senderName,
            message: newMessage.message,
            channelId: newMessage.channelId,
            reaction: newMessage.reactions,
            answers: newMessage.answers,
            timestamp: new Date(),
          });

          if (this.selectedFile && this.currentUserUid) {
            try {
              const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, messageDocRef.id);
              newMessage.fileURL = fileURL;
              await updateDoc(messageDocRef, { fileURL: newMessage.fileURL });
            } catch (error) {
              console.error('Datei-Upload fehlgeschlagen:', error);
            }
          }
          const channelIndex = this.channelsService.channels.findIndex(channel => channel.id === this.channelsService.currentChannelId);
          // console.log(this.channelsService.channels[channelIndex]);
          // console.log(this.channelsService.currentChannelId);


          if (channelIndex !== -1) {
            // Emit the event to switch to the selected channel's chat window
            this.openChannelMessageFromChatEvent.emit({ selectedChannel: this.channelsService.channels[channelIndex], index: channelIndex });
          } else {
            console.error("Selected channel not found in channels array");
          }


        } else {
          this.showError(); // Fehler, wenn kein Benutzer oder Kanal ausgewählt ist
        }

        // Eingabefelder bereinigen und Scrollen
        this.chatMessage = '';
        this.selectedFile = null;
        this.scrollToBottom();
        this.deleteUpload();
      } else {
        console.error('Kein Benutzer angemeldet');
      }
    }
  }

  OpenDirectMessage(selectedUserId: string, i: number) {
    this.openDirectMessageEvent.emit(); // Ruft die Methode in der Elternkomponente auf
  }

  OpenChannelMessage(currentChannelId: string) {
    this.openChannelMessageEvent.emit(); // Ruft die Methode in der Elternkomponente auf

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

  selectChannel(channel: { name: string; id: string }) {
    this.searchQuery = `#${channel.name}`; // Channel-Namen mit # voranstellen
    this.isSearching = false; // Suche beenden
    this.filteredChannels = []; // Gefilterte Channels zurücksetzen
    this.channelsService.currentChannelId = channel.id; // Channel-ID setzen
    // console.log(this.channelsService.currentChannelId);
    // console.log("DirectMessageUser:", this.messageService.directMessageUser);
  }

  selectUser(user: User) {
    if (user && user.id) {
      this.isSearching = false; // Suche beenden
      this.filteredUsers = []; // Gefilterte Benutzer zurücksetzen
      this.selectedUser = user; // Benutzer setzen
      // console.log("Ausgewählter Benutzer:", this.selectedUser.id); // Benutzer anzeigen
      // console.log(this.currentUser()?.id);


    } else {
      console.error("Ungültiger Benutzer:", user); // Fehler protokollieren
    }
  }

}