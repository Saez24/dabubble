import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { addDoc, collection, doc, Firestore, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../../shared/models/user.class';
import { Channel } from '../../../../shared/models/channel.class';
import { UserService } from '../../../../shared/services/firestore/user-service/user.service';
import { AuthService } from '../../../../shared/services/authentication/auth-service/auth.service';
import { UploadFileService } from '../../../../shared/services/firestore/storage-service/upload-file.service';
import { ChannelsService } from '../../../../shared/services/channels/channels.service';
import { MessagesService } from '../../../../shared/services/messages/messages.service';
import { AddMemberDialogComponent } from '../../../../dialogs/add-member-dialog/add-member-dialog.component';
import { ChannelDescriptionDialogComponent } from '../../../../dialogs/channel-description-dialog/channel-description-dialog.component';
import { Message } from '../../../../shared/models/message.class';
import { SafeUrlPipe } from '../../../../shared/pipes/safe-url.pipe';



@Component({
  selector: 'app-channel-message',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, FormsModule,
    MatFormFieldModule, MatInputModule, CommonModule, PickerComponent, SafeUrlPipe, NgIf, NgFor,],
  templateUrl: './channel-message.component.html',
  styleUrl: './channel-message.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class ChannelMessageComponent implements OnInit, AfterViewInit {
  @Output() showThreadEvent = new EventEmitter<Message>();
  messages: Message[] = [];
  selectedMessage: Message | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  channels: Channel[] = [];
  currentUser = this.authService.currentUser;
  showEmojiPicker: boolean = false;
  showEmojiPickerEdit: boolean = false;
  showEmojiPickerReact: boolean = false;
  showMessageEdit = false;
  showMessageEditArea = false;
  channelChatMessage = '';
  messageArea = true;
  editedMessage: string = '';
  currentUserUid = '';
  editingMessageId: string | null = null;
  senderAvatar: string | null = null;
  senderName: string | null = null;
  selectedFile: File | null = null;// Service für den Datei-Upload
  filePreviewUrl: string | null = null;
  searchQuery: string = '';
  isSearching: boolean = false;
  isUserSelect: boolean = false;
  markedUser: { id: string; name: string }[] = [];


  @ViewChild('chatWindow', { static: false }) chatWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth,
    public userService: UserService, private cd: ChangeDetectorRef,
    private authService: AuthService, private uploadFileService: UploadFileService,
    public channelsService: ChannelsService, public dialog: MatDialog, public messageService: MessagesService) { }


  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    const observer = new MutationObserver(() => {
      // console.log('Mutation detected');
      this.scrollToBottom();
    });

    observer.observe(this.chatWindow.nativeElement, { childList: true, subtree: true });
  }

  async loadData() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.loadUsers();
        this.channelsService.loadChannels(user.uid);
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

  scrollToBottom() {
    if (this.chatWindow && this.chatWindow.nativeElement) {
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    }
  }

  toggleSearch(): void {
    this.isUserSelect = !this.isUserSelect; // Suchstatus umschalten
    if (this.isUserSelect) {
      this.onSearch();
    } else {
      this.filteredUsers = []; // Gefilterte Liste zurücksetzen, wenn keine Suche aktiv ist
    }
  }

  updateSearchQuery(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const fullText = target.value;

    // Suche nach dem letzten `@`-Symbol und extrahiere den Teil danach
    const lastAtIndex = fullText.lastIndexOf('@');
    this.searchQuery = lastAtIndex !== -1 ? fullText.slice(lastAtIndex + 1).trim().toLowerCase() : '';

    // Aktivieren der Suche, falls es eine Eingabe nach dem `@` gibt
    this.isSearching = this.searchQuery.length > 0;
    if (this.isSearching) {
      this.onSearch();
    } else {
      this.filteredUsers = []; // Gefilterte Liste zurücksetzen, wenn keine Suche aktiv ist
    }
  }

  selectUser(user: User) {
    if (user && user.id) {
      // Entferne das letzte '@' und füge den vollständigen Benutzernamen hinzu
      this.channelChatMessage = this.channelChatMessage.trim(); // Leerzeichen am Ende entfernen
      const lastAtIndex = this.channelChatMessage.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        // Entferne den '@' und alles dahinter (einschließlich des letzten Benutzernamens)
        this.channelChatMessage = this.channelChatMessage.slice(0, lastAtIndex);
      }

      // Füge den neuen Benutzernamen hinzu
      this.channelChatMessage += ` @${user.name} `;

      // Benutzer zu `markedUser` hinzufügen, falls noch nicht vorhanden
      if (!this.markedUser.some(u => u.id === user.id)) {
        this.markedUser.push({ id: user.id, name: user.name });
        console.log(this.markedUser);

      }

      // Suche zurücksetzen
      this.isSearching = false;
      this.isUserSelect = false;
      this.searchQuery = '';
      this.filteredUsers = [];
    } else {
      console.error("Ungültiger Benutzer:", user);
    }
  }


  onSearch(): void {
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().startsWith(this.searchQuery) ||
      (user.email && user.email.toLowerCase().startsWith(this.searchQuery))
    );
  }

  openChannelDescriptionDialog() {
    this.dialog.open(ChannelDescriptionDialogComponent)
  }

  openAddMemberDialog() {
    this.dialog.open(AddMemberDialogComponent)
  }

  showEmoji() {
    this.showEmojiPickerEdit = false; // Blendet den anderen Picker sofort aus

    // Füge eine Verzögerung hinzu, bevor der aktuelle Picker angezeigt wird
    setTimeout(() => {
      this.showEmojiPicker = !this.showEmojiPicker;
    }, 200); // 200ms Verzögerung, anpassbar nach Bedarf
  }

  showEmojiForEdit() {
    this.showEmojiPicker = false; // Blendet den anderen Picker sofort aus

    // Füge eine Verzögerung hinzu, bevor der aktuelle Picker angezeigt wird
    setTimeout(() => {
      this.showEmojiPickerEdit = !this.showEmojiPickerEdit;
    }, 200); // 200ms Verzögerung, anpassbar nach Bedarf
  }

  showEmojiForReact(message: Message) {
    this.showEmojiPicker = false; // Blendet den anderen Picker sofort aus
    this.showEmojiPickerEdit = false;
    this.selectedMessage = message;
    console.log(this.selectedMessage);
    // Füge eine Verzögerung hinzu, bevor der aktuelle Picker angezeigt wird
    setTimeout(() => {
      this.showEmojiPickerReact = !this.showEmojiPickerReact;
      console.log('showEmojiPickerReact:', this.showEmojiPickerReact);
    }, 200); // 200ms Verzögerung, anpassbar nach Bedarf
  }



  addEmoji(event: any) {
    this.channelChatMessage += event.emoji.native;
  }

  addEmojiForEdit(event: any) {
    this.editedMessage += event.emoji.native;
  }

  addOrUpdateReaction(message: Message, emoji: string): void {
    const currentUser = this.currentUser();
    if (!currentUser) {
      console.warn('Kein Benutzer gefunden!');
      return;
    }

    const senderID = currentUser.id;
    const senderName = currentUser.name || '';
    const emojiReaction = message.reactions.find(r => r.emoji === emoji);

    // Sicherstellen, dass senderID immer ein string ist
    const safeSenderID = senderID ?? '';  // Fällt auf einen leeren String zurück, wenn senderID null oder undefined ist

    if (emojiReaction) {
      // Sicherstellen, dass senderID immer ein Array von Strings ist, auch wenn es null ist
      const senderIDs = emojiReaction.senderID ? emojiReaction.senderID.split(', ') : [];
      const senderNames = emojiReaction.senderName ? emojiReaction.senderName.split(', ') : [];
      const currentUserIndex = senderIDs.indexOf(safeSenderID);

      if (currentUserIndex > -1) {
        // Reaktion entfernen
        senderIDs.splice(currentUserIndex, 1);
        senderNames.splice(currentUserIndex, 1);
        emojiReaction.count -= 1;

        if (emojiReaction.count === 0) {
          const emojiIndex = message.reactions.indexOf(emojiReaction);
          message.reactions.splice(emojiIndex, 1);
        } else {
          emojiReaction.senderID = senderIDs.join(', ');
          emojiReaction.senderName = senderNames.join(', ');
        }
      } else {
        // Reaktion hinzufügen
        emojiReaction.count += 1;
        emojiReaction.senderID += (emojiReaction.senderID ? ', ' : '') + safeSenderID;
        emojiReaction.senderName += (emojiReaction.senderName ? ', ' : '') + senderName;
      }
    } else {
      // Neue Reaktion hinzufügen
      message.reactions.push({
        emoji: emoji,
        senderID: safeSenderID,
        senderName: senderName,
        count: 1
      });
    }

    this.updateMessageReactions(message); // Aktualisiere die Reaktionen in Firestore
  }


  updateMessageReactions(message: Message): void {
    const messageDocRef = doc(this.firestore, `messages/${message.messageId}`);
    updateDoc(messageDocRef, { reactions: message.reactions })
      .then(() => {
        console.log('Reaktionen erfolgreich aktualisiert.');
        this.cd.markForCheck(); // Komponenten-Update anstoßen
      })
      .catch(error => {
        console.error('Fehler beim Aktualisieren der Reaktionen: ', error);
      });
  }

  addEmojiForReact(event: any): void {
    console.log(this.selectedMessage);

    const emoji = event.emoji.native; // Emoji aus dem Event extrahieren
    if (this.selectedMessage) {
      this.addOrUpdateReaction(this.selectedMessage, emoji); // Nutzung der bestehenden Funktion zum Hinzufügen oder Aktualisieren von Reaktionen
      this.showEmojiPickerReact = false; // Emoji-Picker schließen, falls er geöffnet ist
    }
  }

  // addEmojiForReact(event: any): void {
  //   const emoji = event.emoji.native;

  //   if (this.selectedMessage) {
  //     this.appendEmojiToEditedMessage(this.selectedMessage, emoji);
  //   } else if (this.selectedMessage) {
  //     const messageToUpdate = this.findMessageToUpdate(this.selectedMessage);

  //     if (!messageToUpdate) {
  //       return;
  //     }
  //     this.addOrUpdateReaction(messageToUpdate, emoji);
  //     this.updateMessageReactions(messageToUpdate);

  //   }

  //   this.showEmojiPicker = false;
  // }

  // private appendEmojiToEditedMessage(message: Message, emoji: string): void {
  //   const messageToUpdate = this.messages.find((msg) => message.messageId === msg.messageId);

  //   if (messageToUpdate) {
  //     messageToUpdate.message += emoji;
  //   }
  // }

  // private findMessageToUpdate(message: Message): Message | null {
  //   let messageToUpdate = this.messages.find(msg => message.messageId === msg.messageId) || null;
  //   if (!messageToUpdate) {
  //     messageToUpdate = this.selectedMessage || null;
  //   }
  //   return messageToUpdate;
  // }

  toggleEmojiPicker() {
    this.messageService.toggleEmojiPicker();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.showEmojiPicker && !target.closest('emoji-mart') && !target.closest('.message-icon')) {
      this.showEmojiPicker = false;
    }
    if (this.showEmojiPickerEdit && !target.closest('emoji-mart') && !target.closest('.message-icon')) {
      this.showEmojiPickerEdit = false;
    }
    if (this.showEmojiPickerReact && !target.closest('emoji-mart') && !target.closest('.message-icon')) {
      this.showEmojiPickerReact = false;
    }
  }

  showMessageEditToggle() {
    this.showMessageEdit = !this.showMessageEdit;
  }

  editMessage(docId: string, messageText: string | null) {
    this.editingMessageId = docId; // Verwende die Dokument-ID
    this.editedMessage = messageText || '';
    this.showMessageEditArea = true;
    this.showMessageEdit = false;
  }


  saveMessage(message: Message) {
    if (this.editingMessageId) { // Nutze die `editingMessageId` (Dokument-ID) anstelle von `message.messageId`
      const messageRef = doc(this.firestore, `messages/${this.editingMessageId}`); // Verweise auf die Dokument-ID

      updateDoc(messageRef, { message: this.editedMessage }).then(() => {
        this.editingMessageId = null;
        this.showMessageEditArea = false;
      }).catch(error => {
        console.error("Fehler beim Speichern der Nachricht: ", error);
      });
    }
  }

  cancelMessageEdit() {
    this.editingMessageId = null;
    this.editedMessage = '';
    this.showMessageEditArea = false;
  }

  isEditing(docId: string): boolean {
    return this.editingMessageId === docId; // Prüfe gegen die Firestore-Dokument-ID
  }

  showThread(message: Message) {
    this.selectedMessage = message;
    this.showThreadEvent.emit(message); // Lade Antworten nach Auswahl der Nachricht
    console.log(message);
  }

  showError() {
    console.error("Kein Kanal ausgewählt.");
  }

  async sendMessage() {
    if (!this.channelsService.currentChannelId) {
      this.showError(); // Fehler, wenn kein Kanal ausgewählt ist
      return;
    }

    if (this.channelChatMessage.trim() || this.selectedFile) {
      const currentUser = this.authService.currentUser();
      // console.log('channelChatMessage:', this.channelChatMessage);
      // console.log('selectedFile:', this.selectedFile);

      if (currentUser) {
        const messagesRef = collection(this.firestore, 'messages');

        const newMessage: Message = new Message({
          senderID: this.currentUser()?.id,
          senderName: this.currentUser()?.name,
          message: this.channelChatMessage,
          channelId: this.channelsService.currentChannelId, // Verwende die gespeicherte channelId
          reactions: [],
          answers: [],
          fileURL: this.selectedFile ? '' : null,
        });

        const messageDocRef = await addDoc(messagesRef, {
          senderID: newMessage.senderID,
          senderName: newMessage.senderName,
          message: newMessage.message,
          fileURL: newMessage.fileURL,
          channelId: newMessage.channelId,
          reaction: newMessage.reactions,
          answers: newMessage.answers,
          timestamp: new Date(),
        });

        if (this.selectedFile && this.currentUser()?.id) {
          // console.log('File:', this.selectedFile);
          // console.log('currentUserUid:', this.currentUser()?.id);
          try {
            const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUser()?.id || '', messageDocRef.id); // Verwende die ID des neuen Dokuments
            newMessage.fileURL = fileURL; // Setze die Download-URL in der Nachricht
            await updateDoc(messageDocRef, { fileURL: newMessage.fileURL }); // Aktualisiere das Dokument mit der Datei-URL
            // console.log('Datei erfolgreich hochgeladen:', fileURL);

          } catch (error) {
            console.error('Datei-Upload fehlgeschlagen:', error);
          }
        }

        this.channelChatMessage = ''; // Eingabefeld leeren
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

  formatSenderNames(senderNames: string, senderIDs: string): string {
    const senderIDList = senderIDs.split(', ');
    const senderNameList = senderNames.split(', ');
    const currentUserID = this.currentUser()?.id;
    const formattedNames = senderNameList.map((name, index) => {
      return senderIDList[index] === currentUserID ? 'Du' : name;
    });

    if (formattedNames.length > 2) {
      const otherCount = formattedNames.length - 1;
      return `Du und ${otherCount} weitere Personen`;
    } else if (formattedNames.length === 3) {
      return `${formattedNames[0]}, ${formattedNames[1]} und ${formattedNames[2]}`;
    } else if (formattedNames.length === 2) {
      return `${formattedNames[0]} und ${formattedNames[1]}`;
    }
    return formattedNames[0];
  }


  getReactionVerb(senderNames: string, senderIDs: string): string {
    const senderIDList = senderIDs.split(', ');
    const senderNameList = senderNames.split(', ');
    const currentUserID = this.currentUser()?.id;
    const formattedNames = senderNameList.map((name, index) => {
      return senderIDList[index] === currentUserID ? 'Du' : name;
    });

    if (formattedNames.length === 1 && formattedNames[0] === 'Du') {
      return 'hast reagiert';
    }
    if (formattedNames.length === 1) {
      return 'hat reagiert';
    }
    return 'haben reagiert';
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
        // console.log('File saved to localStorage');

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
    console.log('!!!selectedUserId', selectedUserId);

    this.userService.showUserInfo.set(true);
    await this.userService.getSelectedUserById(selectedUserId as string);
  }


  openUserProfile(event: Event) {
    event.stopPropagation();
    this.userService.showProfile.set(true);
    this.userService.showOverlay.set(true);
  }

}
