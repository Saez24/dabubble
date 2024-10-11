import { Injectable, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { Firestore, collection, onSnapshot, query, orderBy, where, Timestamp, DocumentSnapshot, QuerySnapshot, DocumentData, doc, getDoc, collectionData, docData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../firestore/user-service/user.service';
import { Message } from '../../models/message.class';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UploadFileService } from '../firestore/storage-service/upload-file.service';
import { AuthService } from '../authentication/auth-service/auth.service';
import { ChannelsService } from '../channels/channels.service';
import { DirectMessage } from '../../models/direct.message.class';
import { User } from '../../models/user.class';
import { WorkspaceComponent } from '../../../board/workspace/workspace.component';
import { ChatUtilityService } from './chat-utility.service';
import { getDocs, updateDoc } from 'firebase/firestore';


@Injectable({
    providedIn: 'root'
})
export class MessagesService {
    chatMessage: string = '';
    editingMessageId: string | null = null;
    showMessageEditArea: boolean = false;
    showMessageEdit = false;
    showEmojiPicker: boolean = false;
    messages: Message[] = [];
    directMessages: DirectMessage[] = [];
    currentUserUid = this.authService.currentUser()?.id;
    messageArea = true;
    editedMessage = '';
    channelId = this.channelsService.currentChannelId;
    senderAvatar: string | null = null;
    senderName: string | null = null;
    selectedFile: File | null = null;// Service für den Datei-Upload
    filePreviewUrl: string | null = null;
    lastAnswer: string = '';
    selectedMessage: Message | null = null;


    @Output() showThreadEvent = new EventEmitter<void>();
    @ViewChild(WorkspaceComponent) workspaceComponent!: WorkspaceComponent;

    constructor(
        private firestore: Firestore,
        private auth: Auth,
        private userService: UserService,
        private uploadFileService: UploadFileService,
        private authService: AuthService,
        public channelsService: ChannelsService,
        private chatUtilityService: ChatUtilityService
    ) {

    }

    async loadAnswers() {
        if (!this.selectedMessage) {
            this.messages = []; // Wenn keine Nachricht ausgewählt ist, leere die Nachrichten
            return;
        }

        const messageRef = doc(this.firestore, 'messages', this.selectedMessage.messageId);
        const messageSnap = await getDoc(messageRef);

        if (messageSnap.exists()) {
            const selectedMessageData = messageSnap.data();
            const answers = selectedMessageData['answers'] || []; // Verwende Index-Signatur für den Zugriff

            // Bestimme, ob die ausgewählte Nachricht eine eigene Nachricht ist
            this.selectedMessage.isOwnMessage = this.selectedMessage.senderID === this.currentUserUid;

            // Lade nur die Nachrichten, die im answers-Array sind
            this.messages = await Promise.all(answers.map(async (answer: any) => {
                const message = new Message(answer, this.currentUserUid);

                if (message.senderID) {
                    const senderUser = await this.userService.getUserById(message.senderID);
                    message.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
                } else {
                    message.senderAvatar = './assets/images/avatars/avatar5.svg'; // Standard-Avatar
                }

                const messageDate = new Date(answer.timestamp.seconds * 1000);
                message.formattedTimestamp = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return message;
            }));

        } else {
            console.error('Ausgewählte Nachricht existiert nicht');
        }
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

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
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

    async loadMessages(currentUserUid: string | undefined, channelId: string) {
        const messagesQuery = this.createMessageQuery(channelId);

        onSnapshot(messagesQuery, async (snapshot) => {
            this.messages = await this.processSnapshot(snapshot, currentUserUid);
        });
    }

    private createMessageQuery(channelId: string) {
        const messagesRef = collection(this.firestore, 'messages');

        // Filtere die Nachrichten nach der übergebenen channelId
        return query(
            messagesRef,
            where('channelId', '==', channelId), // Filter nach channelId
            orderBy('timestamp')
        );
    }

    private async processSnapshot(snapshot: any, currentUserUid: string | undefined) {
        let lastDisplayedDate: string | null = null;

        return Promise.all(snapshot.docs.map(async (doc: DocumentSnapshot) => {
            const message = await this.mapMessageData(doc, currentUserUid);
            const messageData = doc.data(); // Hier abrufen

            // Sicherstellen, dass messageData definiert ist
            if (messageData) {
                const messageDate = new Date(messageData['timestamp']?.seconds * 1000);
                const formattedDate = this.formatTimestamp(messageDate);

                if (formattedDate !== lastDisplayedDate) {
                    message.displayDate = formattedDate;
                    lastDisplayedDate = formattedDate;
                } else {
                    message.displayDate = null;
                }
            }

            return message;
        }));
    }

    private async mapMessageData(doc: DocumentSnapshot, currentUserUid: string | undefined) {
        const messageData = doc.data();

        // Sicherstellen, dass messageData definiert ist
        if (!messageData) {
            throw new Error('Message data is undefined'); // Fehlerbehandlung
        }

        const message = new Message(messageData, currentUserUid);
        message.messageId = doc.id;
        message.isOwnMessage = message.senderID === currentUserUid;

        if (message.senderID) {
            const senderUser = await this.userService.getUserById(message.senderID);
            message.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
        } else {
            message.senderAvatar = './assets/images/avatars/avatar5.svg';
        }

        // Sicherstellen, dass timestamp definiert ist
        const messageDate = new Date(messageData['timestamp']?.seconds * 1000);
        message.formattedTimestamp = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return message;
    }

    async loadDirectMessages(currentUserUid: string | undefined, targetUserId: string | undefined) {
        if (targetUserId) {
            // Lade den Benutzer basierend auf der targetUserId und setze selectedUser
            this.chatUtilityService.directMessageUser = await this.loadSelectedUser(targetUserId);
        }

        const messagesRef = collection(this.firestore, 'direct_messages');
        const sentMessagesQuery = this.createSentMessagesQuery(messagesRef, currentUserUid, targetUserId);
        const receivedMessagesQuery = this.createReceivedMessagesQuery(messagesRef, currentUserUid, targetUserId);

        const unsubscribeSent = this.subscribeToSentMessages(sentMessagesQuery, currentUserUid);
        const unsubscribeReceived = this.subscribeToReceivedMessages(receivedMessagesQuery, currentUserUid);

        // Optional: Rückgabefunktion zum Abmelden von Snapshots
        return () => {
            unsubscribeSent();
            unsubscribeReceived();
        };
    }

    private async loadSelectedUser(targetUserId: string) {
        return await this.userService.getUserById(targetUserId);
    }

    private createSentMessagesQuery(messagesRef: any, currentUserUid: string | undefined, targetUserId: string | undefined) {
        return query(
            messagesRef,
            where('senderId', '==', currentUserUid),
            where('receiverId', '==', targetUserId),
            orderBy('timestamp')
        );
    }

    private createReceivedMessagesQuery(messagesRef: any, currentUserUid: string | undefined, targetUserId: string | undefined) {
        return query(
            messagesRef,
            where('receiverId', '==', currentUserUid),
            where('senderId', '==', targetUserId),
            orderBy('timestamp')
        );
    }

    private subscribeToSentMessages(sentMessagesQuery: any, currentUserUid: string | undefined) {
        return onSnapshot(sentMessagesQuery, async (snapshot: QuerySnapshot<DocumentData>) => {
            this.directMessages = await this.processMessages(snapshot, currentUserUid, true);
        });
    }

    private subscribeToReceivedMessages(receivedMessagesQuery: any, currentUserUid: string | undefined) {
        return onSnapshot(receivedMessagesQuery, async (snapshot: QuerySnapshot<DocumentData>) => {
            const receivedMessages = await this.processMessages(snapshot, currentUserUid, false);
            this.directMessages = [...this.directMessages.filter(m => m.isOwnMessage), ...receivedMessages];
        });
    }

    private async processMessages(snapshot: QuerySnapshot<DocumentData>, currentUserUid: string | undefined, isSent: boolean) {
        let lastDisplayedDate: string | null = null;

        return Promise.all(snapshot.docs.map(async (doc) => {
            const messageData = doc.data();
            const message = new DirectMessage(messageData, currentUserUid);
            const conversation: DirectMessage[] = messageData['conversation'];
            message.messageId = doc.id;

            await this.processConversation(conversation, currentUserUid, lastDisplayedDate);
            this.chatUtilityService.setMessageId(doc.id);

            return message;
        }));
    }

    private async processConversation(conversation: DirectMessage[], currentUserUid: string | undefined, lastDisplayedDate: string | null) {
        await Promise.all(conversation.map(async (msg: DirectMessage) => {
            await this.loadSenderAvatar(msg);
            this.setMessageDisplayDate(msg, lastDisplayedDate, currentUserUid);
        }));
    }

    private async loadSenderAvatar(msg: DirectMessage) {
        if (msg.senderId) {
            const senderUser = await this.userService.getUserById(msg.senderId);
            msg.senderAvatar = senderUser?.avatarPath || './assets/images/avatars/avatar5.svg';
        } else {
            msg.senderAvatar = './assets/images/avatars/avatar5.svg';
            console.log("Sender ID is undefined for message:", msg);
        }
    }

    private setMessageDisplayDate(msg: DirectMessage, lastDisplayedDate: string | null, currentUserUid: string | undefined) {
        const messageTimestamp = msg.timestamp;
        if (messageTimestamp instanceof Timestamp) {
            const messageDate = messageTimestamp.toDate();
            const formattedDate = this.formatTimestamp(messageDate);
            msg.isOwnMessage = (msg.senderId === currentUserUid);

            // Setze das Anzeigen-Datum
            if (formattedDate !== lastDisplayedDate) {
                msg.displayDate = formattedDate;
                lastDisplayedDate = formattedDate;
            } else {
                msg.displayDate = null;
            }

            // Setze formattedTimestamp für die Nachricht
            msg.formattedTimestamp = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            console.error("Timestamp is not defined or in the expected format.", msg);
        }
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

    getUserName(user: User) {
        this.chatUtilityService.directMessageUser = user;
    }


    // updateSendernameOfMessages() {
    //     this.messages.forEach(async (message) => {
    //         if (message.senderID === this.currentUserUid) {
    //             message.senderName = this.authService.currentUser()?.name;
    //         }
    //     });
    // }


    async getMessagesFromCurrentUser() {
        const q = query(collection(this.firestore, 'messages'), where('senderID', '==', this.authService.currentUserUid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
            const message = doc.data() as Message;
            console.log('MESSAGES: ', message);
            if (message.senderID === this.authService.currentUserUid) {
                this.updateSendernameOfMessage(doc.id, this.authService.currentUser()?.name as string);
            }
        });
    }


    updateSendernameOfMessage(messageId: string, senderName: string) {
        console.log('MESSAGE ID: ', messageId);
        
        const messageRef = doc(this.firestore, 'messages', messageId);
        updateDoc(messageRef, { senderName: senderName });
    }
}