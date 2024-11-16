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
import { v4 as uuidv4 } from 'uuid';

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
        const conversationId = uuidv4();
        if (this.selectedUser?.id) {
          this.messageId = await this.checkExistingConversation(this.selectedUser.id);
          await this.sendDirectMessage(conversationId, currentUser);
        } else if (this.channelsService.currentChannelId) {
          await this.sendChannelMessage(conversationId, currentUser);
        } else {
          this.showError();
        }

        this.clearInputsAndScroll();
      } else {
        console.error('Kein Benutzer angemeldet');
      }
    }
  }

  async sendDirectMessage(conversationId: string, currentUser: any) {
    const messagesRef = collection(this.firestore, 'direct_messages');

    if (this.messageId) {
      await this.updateConversation(messagesRef, conversationId, currentUser);
    } else {
      await this.createNewConversation(messagesRef, conversationId, currentUser);
    }

    if (this.selectedUser) {
      this.handleDirectMessageUser();
    } else {
      console.error("Selected user is undefined");
    }
  }


  async createNewConversation(messagesRef: any, conversationId: string, currentUser: any) {
    const newMessage: DirectMessage = new DirectMessage({
      conversation: [],
      senderId: currentUser()?.id,
      senderName: currentUser()?.name,
      message: this.chatMessage,
      reactions: [],
      fileURL: '',
      receiverId: this.selectedUser?.id,
      receiverName: this.selectedUser?.name,
    });

    const messageDocRef = await addDoc(messagesRef, {
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      timestamp: new Date(),
      conversation: [{
        conversationId: conversationId,
        senderName: newMessage.senderName,
        message: newMessage.message,
        reactions: newMessage.reactions,
        timestamp: new Date(),
        receiverName: newMessage.receiverName,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        fileURL: '',
        readedMessage: false,
      }]
    });

    if (this.selectedFile && this.currentUserUid) {
      await this.uploadFile(messageDocRef);
    }
  }

  async sendChannelMessage(conversationId: string, currentUser: any) {
    const messagesRef = collection(this.firestore, 'messages');
    const newMessage: Message = new Message({
      senderID: currentUser()?.id,
      senderName: currentUser()?.name,
      message: this.chatMessage,
      channelId: this.channelsService.currentChannelId,
      reactions: [],
      answers: [],
      fileURL: this.selectedFile ? this.selectedFile : '',
    });

    const messageDocRef = await addDoc(messagesRef, {
      senderID: newMessage.senderID,
      senderName: newMessage.senderName,
      message: newMessage.message,
      channelId: newMessage.channelId,
      reactions: newMessage.reactions,
      answers: newMessage.answers,
      fileURL: this.selectedFile ? this.selectedFile : '',
      timestamp: new Date(),
    });

    if (this.selectedFile && this.currentUserUid) {
      await this.uploadFile(messageDocRef);
    }

    this.handleChannelMessage();
  }

  async uploadFile(messageDocRef: any) {
    if (this.selectedFile && this.currentUserUid !== undefined) {
      try {
        const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, messageDocRef.id);
        await updateDoc(messageDocRef, { fileURL });
      } catch (error) {
        console.error('Datei-Upload fehlgeschlagen:', error);
      }
    } else {
      console.error('No file selected');
    }
  }

  handleDirectMessageUser() {
    if (this.selectedUser) {
      const userIndex = this.users.findIndex(user => user.id === this.selectedUser?.id);
      if (userIndex !== -1) {
        this.chatUtilityService.openDirectMessageFromChat(this.selectedUser, userIndex);
      } else {
        console.error("User not found in users array for ID:", this.selectedUser?.id);
      }
    } else {
      console.error("Selected user is null");
    }
  }

  handleChannelMessage() {
    const channelIndex = this.channelsService.channels.findIndex(channel => channel.id === this.channelsService.currentChannelId);
    if (channelIndex !== -1) {
      this.chatUtilityService.openChannelMessageFromChat(this.channelsService.channels[channelIndex], channelIndex);
    } else {
      console.error("Selected channel not found in channels array");
    }
  }
  async updateConversation(messagesRef: any, conversationId: string, currentUser: any) {
    if (this.messageId !== null) {
      const messageDocRef = doc(messagesRef, this.messageId);
      await updateDoc(messageDocRef, {
        conversation: arrayUnion({
          conversationId: conversationId,
          senderName: currentUser()?.name,
          message: this.chatMessage,
          reactions: [],
          timestamp: new Date(),
          receiverName: this.selectedUser?.name,
          senderId: currentUser()?.id,
          receiverId: this.selectedUser?.id,
          fileURL: '',
          readedMessage: false,
        })
      });
    } else {
      console.error("Message ID ist null");
    }
  }

  clearInputsAndScroll() {
    this.chatMessage = '';
    this.selectedFile = null;
    this.scrollToBottom();
    this.deleteUpload();
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


  async getThreadsFromCurrentUser() {
    const q = query(collection(this.firestore, 'direct_messages'), where('senderID', '==', this.authService.currentUserUid));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      const message = doc.data() as Message;
      console.log('!!!SENT:', message);
      this.updateSendernameOfThread(doc.id, this.authService.currentUser()?.name as string);
    });


    // for (let index = 0; index < message.conversation.length; index++) {
    //   const element = message.conversation[index];
    //   if (element.receiverId === this.authService.currentUserUid) {
    //     console.log('Empfangen: ', element);
    //     this.updateSendernameOfThread(doc.id, 'receiverName');
    //   }
    //   if (element.senderId === this.authService.currentUserUid) {
    //     console.log('Gesendet: ', element);
    //     this.updateSendernameOfThread(doc.id, 'senderName');
    //   }
    // }
  }


  updateSendernameOfThread(threadId: string, threadType: string) {
    const threadRef = doc(this.firestore, 'direct_messages', threadId);
    updateDoc(threadRef, { [(threadType)]: this.authService.currentUser()?.name });
  }
}