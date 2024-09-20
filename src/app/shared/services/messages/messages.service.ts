import { Injectable, EventEmitter, HostListener, Output } from '@angular/core';
import { Firestore, doc, updateDoc, addDoc, collection, onSnapshot, query, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../firestore/user-service/user.service';
import { Message } from '../../models/message.class';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { BehaviorSubject } from 'rxjs';
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
    @Output() showThreadEvent = new EventEmitter<void>();

    constructor(private firestore: Firestore, private auth: Auth, private userService: UserService) { }


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

    async saveMessage(message: Message) {
        if (message.messageId) {
            const messageRef = doc(this.firestore, `messages/${message.messageId}`);
            try {
                await updateDoc(messageRef, { message: message.message });
                this.editingMessageId = null;
                this.showMessageEditArea = false;
            } catch (error) {
                console.error("Fehler beim Speichern der Nachricht: ", error);
            }
        }
    }

    async sendMessage() {
        if (this.chatMessage.trim()) {
            const currentUser = this.auth.currentUser;

            if (currentUser) {
                const messagesRef = collection(this.firestore, 'messages');
                const newMessageRef = doc(messagesRef);

                const newMessage: Message = new Message({
                    messageId: newMessageRef.id,
                    senderID: currentUser.uid,
                    senderName: currentUser.displayName,
                    message: this.chatMessage,
                    reaction: '',
                    answers: [],
                });

                await addDoc(messagesRef, {
                    messageId: newMessage.messageId,
                    senderID: newMessage.senderID,
                    senderName: newMessage.senderName,
                    message: newMessage.message,
                    reaction: newMessage.reaction,
                    answers: newMessage.answers,
                    timestamp: new Date(),
                });

                console.log("Nachricht gesendet, lade Nachrichten neu.");
                this.chatMessage = ''; // Leere das Eingabefeld
            } else {
                console.error('Kein Benutzer angemeldet');
            }
        }
    }

    async loadMessages(p0: (messages: any) => void) {
        const messagesRef = collection(this.firestore, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp'));

        onSnapshot(messagesQuery, async (snapshot) => {
            let lastDisplayedDate: string | null = null;

            const messages = await Promise.all(snapshot.docs.map(async (doc) => {
                const messageData = doc.data();
                const message = new Message(messageData, this.currentUserUid);

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

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Heute';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Gestern';
        } else {
            return messageDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        }
    }
}


