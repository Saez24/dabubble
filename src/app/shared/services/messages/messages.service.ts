import { Injectable, EventEmitter, HostListener, Output, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../firestore/user-service/user.service';
import { Message } from '../../models/message.class';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { BehaviorSubject } from 'rxjs';
import { UploadFileService } from '../firestore/storage-service/upload-file.service';
import { AuthService } from '../authentication/auth-service/auth.service';
import { ChannelsService } from '../channels/channels.service';
// Importiere deinen UserService

@Injectable({
    providedIn: 'root'
})
export class MessagesService {
    private messagesSubject = new BehaviorSubject<Message[]>([]);
    messages$ = this.messagesSubject.asObservable();
    private chatMessage: string = '';
    private editingMessageId: string | null = null;
    private showMessageEditArea: boolean = false;
    private showMessageEdit = false;
    private showEmojiPicker: boolean = false;
    messages: Message[] = [];
    currentUserUid = this.authService.currentUserUid; // Setze den aktuellen Benutzer-UID
    messageArea = true;
    editedMessage = '';
    channelId = this.channelsService.currentChannelId;
    senderAvatar: string | null = null;
    senderName: string | null = null;
    selectedFile: File | null = null;// Service für den Datei-Upload
    filePreviewUrl: string | null = null;
    @Output() showThreadEvent = new EventEmitter<void>();

    constructor(private firestore: Firestore, private auth: Auth, private userService: UserService,
        private uploadFileService: UploadFileService, private authService: AuthService, public channelsService: ChannelsService,) { }


    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    toggleMessageEdit() {
        this.showMessageEditArea = !this.showMessageEditArea;
    }

    showMessageEditToggle() {
        this.showMessageEdit = !this.showMessageEdit;
    }

    editMessage(messageId: string) {
        this.editingMessageId = messageId;
        this.showMessageEditArea = true;
    }
    cancelMessageEdit() {
        this.editingMessageId = null;
        this.showMessageEditArea = false;
    }

    isEditing(messageId: string): boolean {
        return this.editingMessageId === messageId;
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

    showThread() {
        this.showThreadEvent.emit();
    }

    async loadMessages(currentUserUid: string, channelId: string) {
        const messagesRef = collection(this.firestore, 'messages');
        console.log(channelId);

        // Filtere die Nachrichten nach der übergebenen channelId
        const messagesQuery = query(
            messagesRef,
            where('channelId', '==', channelId), // Hier filtern wir nach channelId
            orderBy('timestamp')
        );

        onSnapshot(messagesQuery, async (snapshot) => {
            let lastDisplayedDate: string | null = null;

            this.messages = await Promise.all(snapshot.docs.map(async (doc) => {
                const messageData = doc.data();
                const message = new Message(messageData, currentUserUid);

                message.messageId = doc.id;
                message.isOwnMessage = message.senderID === currentUserUid;
                console.log('isOwnMessage: ', message.isOwnMessage);
                // console.log(message.senderID);
                // console.log(this.currentUserUid);

                // Überprüfen, ob senderID nicht null ist
                if (message.senderID) {
                    const senderUser = await this.userService.getUserById(message.senderID);
                    message.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
                } else {
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
        });
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


    // async saveMessage(message: Message) {
    //     if (message.messageId) {
    //         const messageRef = doc(this.firestore, `messages/${message.messageId}`);
    //         try {
    //             await updateDoc(messageRef, { message: message.message });
    //             this.editingMessageId = null;
    //             this.showMessageEditArea = false;
    //         } catch (error) {
    //             console.error("Fehler beim Speichern der Nachricht: ", error);
    //         }
    //     }
    // }

    // showError() {
    //     console.error("Kein Kanal ausgewählt.");
    // }

    // async sendMessage() {
    //     if (!this.selectedChannelId) {
    //         this.showError(); // Fehler, wenn kein Kanal ausgewählt ist
    //         return;
    //     }

    //     if (this.chatMessage.trim() || this.selectedFile) {
    //         const currentUser = this.authService.currentUser;

    //         if (currentUser()) {
    //             const messagesRef = collection(this.firestore, 'messages');

    //             const newMessage: Message = new Message({
    //                 senderID: this.currentUserUid,
    //                 senderName: this.senderName,
    //                 message: this.chatMessage,
    //                 channelId: this.selectedChannelId, // Verwende die gespeicherte channelId
    //                 reaction: '',
    //                 answers: [],
    //                 fileURL: '',
    //             });

    //             const messageDocRef = await addDoc(messagesRef, {
    //                 senderID: newMessage.senderID,
    //                 senderName: newMessage.senderName,
    //                 message: newMessage.message,
    //                 channelId: newMessage.channelId,
    //                 reaction: newMessage.reaction,
    //                 answers: newMessage.answers,
    //                 timestamp: new Date(),
    //             });

    //             if (this.selectedFile && this.currentUserUid) {
    //                 try {
    //                     const fileURL = await this.uploadFileService.uploadFileWithIds(this.selectedFile, this.currentUserUid, messageDocRef.id); // Verwende die ID des neuen Dokuments
    //                     newMessage.fileURL = fileURL; // Setze die Download-URL in der Nachricht
    //                     await updateDoc(messageDocRef, { fileURL: newMessage.fileURL }); // Aktualisiere das Dokument mit der Datei-URL
    //                 } catch (error) {
    //                     console.error('Datei-Upload fehlgeschlagen:', error);
    //                 }
    //             }


    //         } else {
    //             console.error('Kein Benutzer angemeldet');
    //         }
    //     }
    // }



    // formatTimestamp(messageDate: Date): string {
    //     const today = new Date();
    //     const yesterday = new Date();
    //     yesterday.setDate(today.getDate() - 1);

    //     if (messageDate.toDateString() === today.toDateString()) {
    //         return 'Heute';
    //     } else if (messageDate.toDateString() === yesterday.toDateString()) {
    //         return 'Gestern';
    //     } else {
    //         return messageDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
    //     }
    // }


}


