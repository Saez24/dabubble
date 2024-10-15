import { ElementRef, Injectable, ViewChild } from '@angular/core';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { UserService } from '../firestore/user-service/user.service';
import { AuthService } from '../authentication/auth-service/auth.service';
import { UploadFileService } from '../firestore/storage-service/upload-file.service';
import { addDoc, arrayUnion, collection, doc, Firestore, getDocs, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { ChannelsService } from '../channels/channels.service';
import { DirectMessage } from '../../models/direct.message.class';
import { Message } from '../../models/message.class';
import { ChatUtilityService } from './chat-utility.service';

@Injectable({
  providedIn: 'root'
})
export class SendMessageService {
  users: User[] = [];
  channels: Channel[] = [];
  currentUser = this.authService.getUserSignal();
  showEmojiPicker = false;
  chatMessage = '';
  currentUserUid = this.currentUser()?.id;
  senderAvatar: string | null = null;
  senderName: string | null = null;
  selectedFile: File | null = null;// Service für den Datei-Upload
  filePreviewUrl: string | null = null;
  selectedUser = this.userService.selectedUser;
  messageId: string | null = null;
  @ViewChild('chatWindow') private chatWindow!: ElementRef;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private uploadFileService: UploadFileService,
    private channelsService: ChannelsService,
    private firestore: Firestore,
    private chatUtilityService: ChatUtilityService) {

    this.loadUsers();
  }

  async loadUsers() {
    const usersRef = collection(this.firestore, 'users');
    const usersQuery = query(usersRef, orderBy('name'));

    return new Promise((resolve) => {
      onSnapshot(usersQuery, async (snapshot) => {
        this.users = await Promise.all(snapshot.docs.map(async (doc) => {
          const userData = doc.data() as User;
          return { ...userData, id: doc.id };
        }));
        resolve(this.users); // Promise auflösen
      });
    });
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
          // console.log("DirectMessageUser:", this.selectedUser.id); // Überprüfen, ob der Benutzer korrekt gesetzt ist
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
          if (this.selectedUser) {
            // console.log("Users Array:", this.users);
            // console.log("Selected User ID:", this.selectedUser.id);

            const userIndex = this.users.findIndex(user => user.id === this.selectedUser?.id);
            // console.log("User Index:", userIndex);

            if (userIndex !== -1) {
              this.chatUtilityService.openDirectMessageFromChat(this.selectedUser, userIndex);
            } else {
              console.error("User not found in users array for ID:", this.selectedUser.id);
            }
          } else {
            console.error("Selected user is undefined");
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
            this.chatUtilityService.openChannelMessageFromChat(this.channelsService.channels[channelIndex], channelIndex);
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

  showError() {
    console.error("Kein Kanal ausgewählt.");
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


  async getThreadFromCurrentUser() {
    const q = query(collection(this.firestore, 'direct_messages'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (doc) => {
      const message = doc.data() as DirectMessage;

      for (let index = 0; index < message.conversation.length; index++) {
        const element = message.conversation[index];
        if (element.receiverId === this.authService.currentUserUid) {
          console.log('Empfangen: ', element);
          this.updateSendernameOfThread(doc.id, 'receiverName');
        }
        if (element.senderId === this.authService.currentUserUid) {
          console.log('Gesendet: ', element);
          this.updateSendernameOfThread(doc.id, 'senderName');
        }
      }
    });
  }


  updateSendernameOfThread(threadId: string, threadType: string) {
    const threadRef = doc(this.firestore, 'direct_messages', threadId);
    updateDoc(threadRef, { [(threadType)]: this.authService.currentUser()?.name });
  }
}