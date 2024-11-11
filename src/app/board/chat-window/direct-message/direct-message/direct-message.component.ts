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
import { addDoc, arrayUnion, collection, doc, Firestore, getDoc, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
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
import { v4 as uuidv4 } from 'uuid';
import { EmojiReaction } from '../../../../shared/models/emoji-reaction.model';




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
  message: DirectMessage[] = [];
  selectedMessage: DirectMessage | null = null;
  messages = this.messagesService.messages;
  users: User[] = [];
  channels: Channel[] = [];
  currentUser = this.authService.getUserSignal();
  showEmojiPicker = false;
  showEmojiPickerEdit: boolean = false;
  showEmojiPickerReact: boolean = false;
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
  conversationId = '';
  editingConversationId: string | null = null;



  @ViewChild('chatWindow') private chatWindow!: ElementRef;
  constructor(private firestore: Firestore, private auth: Auth,
    private userService: UserService, private cd: ChangeDetectorRef,
    private authService: AuthService, private uploadFileService: UploadFileService,
    public channelsService: ChannelsService, public dialog: MatDialog, public messagesService: MessagesService, private chatUtilityService: ChatUtilityService) {

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

  // loadConversation(message: DirectMessage): void {
  //   if (message) {
  //     this.messagesService.loadConversations(message);
  //   } else {
  //     console.error('Keine Nachricht zum Laden verfügbar');
  //   }
  // }

  // testLoadConversation(): void {
  //   this.message = {
  //     messageId: 'deineMessageId'  // Setze die tatsächliche messageId
  //   } as DirectMessage;

  //   this.loadConversation(this.message);
  // }


  showEmoji() {
    this.showEmojiPickerEdit = false; // Blendet den anderen Picker sofort aus
    setTimeout(() => {
      this.showEmojiPicker = !this.showEmojiPicker;
    }, 200); // 200ms Verzögerung, anpassbar nach Bedarf
  }

  showEmojiForEdit() {
    this.showEmojiPicker = false; // Blendet den anderen Picker sofort aus
    setTimeout(() => {
      this.showEmojiPickerEdit = !this.showEmojiPickerEdit;
    }, 200); // 200ms Verzögerung, anpassbar nach Bedarf
  }

  showEmojiForReact(message: DirectMessage, conversationId: string) {
    this.showEmojiPicker = false;
    this.showEmojiPickerEdit = false;
    this.conversationId = conversationId;
    this.selectedMessage = message;
    // console.log('showEmojiForReact aufgerufen');
    // console.log('conversationId in showEmojiForReact:', this.conversationId);
    // console.log(this.selectedMessage);


    setTimeout(() => {
      this.showEmojiPickerReact = !this.showEmojiPickerReact;
      this.cd.markForCheck(); // Komponenten-Update anstoßen
      // console.log('showEmojiPickerReact nach setTimeout:', this.showEmojiPickerReact);
    }, 200);
  }


  addEmoji(event: any) {
    this.directChatMessage += event.emoji.native;
  }

  addEmojiForEdit(event: any) {
    this.editedMessage += event.emoji.native;
  }

  findConversation(conversations: any[], targetId: string): any | null {
    for (const convo of conversations) {
      if (convo.conversationId === targetId) {
        return convo;
      } else if (Array.isArray(convo.subConversations)) {
        const result = this.findConversation(convo.subConversations, targetId);
        if (result) return result;
      }
    }
    return null;
  }


  addOrUpdateReaction(message: DirectMessage, emoji: string): void {
    const currentUser = this.currentUser();
    if (!currentUser) {
      console.warn('Kein Benutzer gefunden!');
      return;
    }

    const senderID = currentUser.id ?? '';
    const senderName = currentUser.name || '';

    if (!Array.isArray(message.conversation)) {
      console.log(message.conversation);

      console.warn('message.conversation ist undefined oder kein Array!');
      return;
    }

    // Suche nach der passenden Konversation anhand der conversationId
    const conversation = this.findConversation(message.conversation, this.conversationId);

    if (!conversation) {
      console.warn(`Konversation mit der ID ${this.conversationId} nicht gefunden!`);
      return;
    }

    // Emoji-Reaktion verarbeiten
    let emojiReaction = conversation.reactions?.find((r: EmojiReaction) => r.emoji === emoji);
    if (emojiReaction) {
      const senderIDs = emojiReaction.senderID ? emojiReaction.senderID.split(', ') : [];
      const senderNames = emojiReaction.senderName ? emojiReaction.senderName.split(', ') : [];
      const currentUserIndex = senderIDs.indexOf(senderID);

      if (currentUserIndex > -1) {
        // Benutzer hat bereits reagiert – Reaktion entfernen
        senderIDs.splice(currentUserIndex, 1);
        senderNames.splice(currentUserIndex, 1);
        emojiReaction.count -= 1;

        // Reaktion entfernen, wenn der Zähler auf 0 sinkt
        if (emojiReaction.count === 0) {
          conversation.reactions = conversation.reactions?.find((r: EmojiReaction) => r.emoji === emoji);
        } else {
          emojiReaction.senderID = senderIDs.join(', ');
          emojiReaction.senderName = senderNames.join(', ');
        }
      } else {
        // Reaktion hinzufügen
        emojiReaction.count += 1;
        emojiReaction.senderID += (emojiReaction.senderID ? ', ' : '') + senderID;
        emojiReaction.senderName += (emojiReaction.senderName ? ', ' : '') + senderName;
      }
    } else {
      // Eine neue Emoji-Reaktion hinzufügen
      if (!conversation.reactions) {
        conversation.reactions = [];
      }
      conversation.reactions.push({
        emoji: emoji,
        senderID: senderID,
        senderName: senderName,
        count: 1
      });
    }

    // Aktualisierung der Reaktionen für die spezifische Nachricht in Firestore
    this.updateMessageReactions(message);
  }




  updateMessageReactions(message: DirectMessage): void {
    const messageDocRef = doc(this.firestore, `direct_messages/${this.messageId}`);

    // Nur die aktualisierte Konversation finden
    const updatedConversations = (message.conversation || []).map(convo => {
      if (convo.conversationId) {
        return {
          ...convo,
          reactions: convo.reactions // Aktualisiere nur die Reaktionen in der Ziel-Konversation
        };
      }
      return convo;
    });

    updateDoc(messageDocRef, { conversation: updatedConversations })
      .then(() => {
        console.log('Reaktionen erfolgreich aktualisiert.');
        this.cd.markForCheck(); // Komponenten-Update anstoßen
      })
      .catch(error => {
        console.error('Fehler beim Aktualisieren der Reaktionen: ', error);
      });
  }


  addEmojiForReact(event: any): void {
    const emoji = event.emoji.native;
    // Überprüfe, ob selectedMessage nicht null ist
    if (this.selectedMessage !== null) {
      // Überprüfe, ob selectedMessage die KonversationId enthält
      if (this.selectedMessage.conversationId) {
        // Konversation gefunden, füge oder aktualisiere die Reaktion
        this.addOrUpdateReaction(this.selectedMessage, emoji,);
        this.showEmojiPickerReact = false;
        console.log(this.selectedMessage);
        console.log(this.conversationId);
      } else {
        console.warn('Konversation mit der ID nicht gefunden!');
      }
    } else {
      console.warn('Nachricht oder Konversation ist null oder leer!');
    }
  }





  toggleEmojiPicker() {
    this.messagesService.toggleEmojiPicker();
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

  showMessageEditToggle() {
    this.showMessageEdit = !this.showMessageEdit;
    console.log(this.showMessageEdit);
  }



  editMessage(conversationId: string) {
    this.editingMessageId = conversationId;
    this.showMessageEditArea = true;         // Bearbeitungsbereich anzeigen
    this.showMessageEdit = false;            // Toggle zurücksetzen
    this.editingConversationId = conversationId;
    console.log('editMessage aufgerufen');
    console.log('showMessageEditArea:', this.showMessageEditArea);
    console.log('conversationId:', this.editingConversationId);
  }


  saveMessage(message: DirectMessage, conversationId: string) {
    console.log(this.conversationId);

    if (message && this.messageId) {
      const messageRef = doc(this.firestore, `direct_messages/${this.messageId}`);

      const updatedConversation = (message.conversation || []).map(convo => {
        if (convo.conversationId === conversationId) {
          return {
            ...convo,
            message: convo.message // Aktualisiere nur das `message`-Feld
          };
        }
        return convo;
      });

      updateDoc(messageRef, { conversation: updatedConversation })
        .then(() => {
          this.closeMessageEdit();
          console.log("Nachricht erfolgreich aktualisiert.");
        })
        .catch(error => {
          console.error("Fehler beim Speichern der Nachricht:", error);
        });
    } else {
      console.error("Ungültige Nachricht oder Conversation-ID.");
    }
  }


  closeMessageEdit() {
    this.editingMessageId = null;
    this.conversationId = '';
    this.editedMessage = '';
    this.showMessageEditArea = false;
    this.editingConversationId = null;
  }

  isEditing(conversationId: string): boolean {
    return this.editingConversationId === conversationId; // Prüfe gegen die Firestore-Dokument-ID
  }


  showError() {
    console.error("Kein Kanal ausgewählt.");
  }

  async sendMessage() {
    if (this.directChatMessage.trim() || this.selectedFile) {
      const currentUser = this.authService.currentUser;

      if (currentUser()) {
        const messagesRef = collection(this.firestore, 'direct_messages');
        const conversationId = uuidv4();

        if (this.messageId) {
          // Konversation existiert, also aktualisiere sie
          const messageDocRef = doc(messagesRef, this.messageId);

          // Füge die neue Nachricht zur bestehenden Konversation hinzu
          await updateDoc(messageDocRef, {
            conversation: arrayUnion({
              conversationId: conversationId,
              senderName: currentUser()?.name,
              message: this.directChatMessage,
              reaction: [],
              timestamp: new Date(),
              receiverName: this.selectedUser?.name,
              senderId: currentUser()?.id,
              receiverId: this.selectedUser?.id,
              fileURL: '',
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
                conversationId: conversationId,
                senderName: newMessage.senderName,
                message: newMessage.message,
                reaction: newMessage.reactions,
                timestamp: new Date(),
                receiverName: newMessage.receiverName,
                senderId: newMessage.senderId,
                receiverId: newMessage.receiverId,
                fileURL: '',
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


  async getSelectedUserInfo(selectedUserId: string | null | undefined) {
    console.log('Selected User ID:', selectedUserId);

    this.userService.showUserInfo.set(true);
    await this.userService.getSelectedUserById(selectedUserId as string);
  }


  openUserProfile(event: Event) {
    event.stopPropagation();
    this.userService.showProfile.set(true);
    this.userService.showOverlay.set(true);
  }

}