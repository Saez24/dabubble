import { Injectable, EventEmitter, HostListener, Output } from '@angular/core';
import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../firestore/user-service/user.service';
import { Message } from '../../models/message.class';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { BehaviorSubject } from 'rxjs';
import { UploadFileService } from '../firestore/storage-service/upload-file.service';
import { AuthService } from '../authentication/auth-service/auth.service';
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
    private messages: Message[] = [];
    private currentUserUid: string | null = null; // Setze den aktuellen Benutzer-UID



    messageArea = true;
    editedMessage = '';

    channelId: string | null = null;
    selectedChannelId: string | null = 'hJHD4P2xWfH9J45vaZPS';
    senderAvatar: string | null = null;
    senderName: string | null = null;
    selectedFile: File | null = null;// Service für den Datei-Upload
    filePreviewUrl: string | null = null;
    @Output() showThreadEvent = new EventEmitter<void>();

    constructor(private firestore: Firestore, private auth: Auth, private userService: UserService, private uploadFileService: UploadFileService, private authService: AuthService) { }


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


