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
import { addDoc, arrayUnion, collection, doc, Firestore, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { ChannelsService } from '../../../../shared/services/channels/channels.service';
import { MessagesService } from '../../../../shared/services/messages/messages.service';
import { UploadFileService } from '../../../../shared/services/firestore/storage-service/upload-file.service';
import { AuthService } from '../../../../shared/services/authentication/auth-service/auth.service';
import { UserService } from '../../../../shared/services/firestore/user-service/user.service';
import { User } from '../../../../shared/models/user.class';
import { Channel } from '../../../../shared/models/channel.class';
import { Message } from '../../../../shared/models/message.class';
import { DirectMessage } from '../../../../shared/models/direct.message.class';
import { ChatUtilityService } from '../../../../shared/services/messages/chat-utility.service';


@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, NgIf, NgFor],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class DirectMessageComponent implements OnInit {

  messages = this.messageService.messages;
  users: User[] = [];
  channels: Channel[] = [];
  currentUser = this.authService.getUserSignal();
  showEmojiPicker = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  directChatMessage = '';
  messageArea = true;
  editedMessage = '';
  currentUserUid = '';
  editingMessageId: string | null = null;
  senderAvatar: string | null = null;
  senderName: string | null = null;
  selectedFile: File | null = null;// Service für den Datei-Upload
  filePreviewUrl: string | null = null;
  @Input() selectedUser = this.chatUtilityService.directMessageUser;
  messageId: string | null = null;



  @ViewChild('chatWindow') private chatWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth,
    private userService: UserService, private cd: ChangeDetectorRef,
    private authService: AuthService, private uploadFileService: UploadFileService,
    public channelsService: ChannelsService, public dialog: MatDialog, public messageService: MessagesService, private chatUtilityService: ChatUtilityService) {

  }

  ngOnInit() {
    this.chatUtilityService.messageId$.subscribe(id => {
      this.messageId = id;
      // console.log('Aktuelle Message ID:', this.messageId);
    });
  }

  async loadData() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.loadUsers();
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

  showEmoji() {
    this.messageService.showEmoji();
  }

  addEmoji(event: any) {
    this.directChatMessage += event.emoji.native;
  }

  toggleEmojiPicker() {
    this.messageService.toggleEmojiPicker();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.messageService.showEmojiPicker && !target.closest('emoji-mart') && !target.closest('.message-icon')) {
      this.messageService.showEmojiPicker = false;
    }
  }

  showMessageEditToggle() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage(docId: string) {
    this.editingMessageId = docId; // Verwende die Dokument-ID
    this.showMessageEditArea = true;
    this.showMessageEdit = false;
  }

  saveMessage(message: DirectMessage) {
    if (this.editingMessageId) { // Nutze die `editingMessageId` (Dokument-ID) anstelle von `message.messageId`
      const messageRef = doc(this.firestore, `direct_messages/${this.editingMessageId}`); // Verweise auf die Dokument-ID

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


  @Output() showThreadEvent = new EventEmitter<Message>();
  showThread(message: Message) {
    this.showThreadEvent.emit(message);
  }

  showError() {
    console.error("Kein Kanal ausgewählt.");
  }

  async sendMessage() {
    if (this.directChatMessage.trim() || this.selectedFile) {
      const currentUser = this.authService.currentUser;

      if (currentUser()) {
        const messagesRef = collection(this.firestore, 'direct_messages');

        if (this.messageId) {
          // Konversation existiert, also aktualisiere sie
          const messageDocRef = doc(messagesRef, this.messageId);

          // Füge die neue Nachricht zur bestehenden Konversation hinzu
          await updateDoc(messageDocRef, {
            conversation: arrayUnion({
              senderName: currentUser()?.name,
              message: this.directChatMessage,
              reaction: [],
              timestamp: new Date(),
              receiverName: this.selectedUser?.name,
              senderId: currentUser()?.id,
              receiverId: this.selectedUser?.id,
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
            message: this.directChatMessage,
            reactions: [],
            fileURL: '',
            receiverId: this.chatUtilityService.directMessageUser?.id,
            receiverName: this.chatUtilityService.directMessageUser?.name,
          });

          // Füge die neue Konversation in Firestore hinzu
          const messageDocRef = await addDoc(messagesRef, {
            senderId: newMessage.senderId,
            receiverId: newMessage.receiverId,
            timestamp: new Date(),
            conversation: [
              {
                senderName: newMessage.senderName,
                message: newMessage.message,
                reaction: newMessage.reactions,
                timestamp: new Date(),
                receiverName: newMessage.receiverName,
                senderId: newMessage.senderId,
                receiverId: newMessage.receiverId,
              }
            ]
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

        // Eingabefelder bereinigen und Scrollen
        this.directChatMessage = '';
        this.selectedFile = null;
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


  async getSelectedUserInfo(selectedUserId: string | null) {
    this.userService.showUserInfo.set(true);
    await this.userService.getUserById(selectedUserId as string);
  }


  openUserProfile(event: Event) {
    event.stopPropagation();
    this.userService.showProfile.set(true);
    this.userService.showOverlay.set(true);
  }

}