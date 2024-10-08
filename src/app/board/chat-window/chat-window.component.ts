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
import { addDoc, collection, doc, Firestore, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
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
import { DirectMessageComponent } from './direct-message/direct-message/direct-message.component';
import { ChannelMessageComponent } from './channel-message/channel-message/channel-message.component';



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


  @ViewChild('chatWindow') private chatWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth,
    private userService: UserService, private cd: ChangeDetectorRef,
    private authService: AuthService, private uploadFileService: UploadFileService,
    public channelsService: ChannelsService, public dialog: MatDialog, public messageService: MessagesService) { }

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
          senderID: this.currentUser()?.id,
          senderName: this.currentUser()?.name,
          message: this.chatMessage,
          channelId: this.channelsService.currentChannelId, // Verwende die gespeicherte channelId
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
            const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, messageDocRef.id); // Verwende die ID des neuen Dokuments
            newMessage.fileURL = fileURL; // Setze die Download-URL in der Nachricht
            await updateDoc(messageDocRef, { fileURL: newMessage.fileURL }); // Aktualisiere das Dokument mit der Datei-URL
          } catch (error) {
            console.error('Datei-Upload fehlgeschlagen:', error);
          }
        }

        this.chatMessage = ''; // Eingabefeld leeren
        this.selectedFile = null; // Reset selectedFile
        this.messageService.loadMessages(this.authService.currentUser()?.id, this.channelsService.currentChannelId);
        // Übergebe die channelId
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