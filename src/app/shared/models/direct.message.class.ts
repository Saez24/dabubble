
export class DirectMessage {
    timestamp(timestamp: any): string {
        throw new Error('Method not implemented.');
    }
    messageId: string;
    senderId: string | null;
    senderName: string | null;
    message: string | null;
    reactions: { emoji: string; senderName: string; count: number }[] = [];
    formattedTimestamp: string;
    isOwnMessage: boolean = false;
    displayDate: string | null;
    senderAvatar: string | null | undefined;
    fileURL: string | null;
    receiverId: string | null;
    receiverName: string | null;
    conversation: { // Jede Nachricht in der Konversation
        senderName: string | null;
        message: string | null;
        messageId: string;
        reactions: { emoji: string; senderName: string; count: number }[];
        timestamp: any; // Anpassen des Typs je nach Bedarf
        receiverName: string | null;
        receiverId: string | null;
        senderId: string | null;
        formattedTimestamp: string;
        isOwnMessage: boolean;
        displayDate: string | null;
        senderAvatar: string | null | undefined;
        fileURL: string | null;
    }[];


    constructor(obj?: any, currentUserUid?: string | null) {
        this.messageId = obj ? obj.messageId : null;
        this.senderId = obj ? obj.senderId : null;
        this.senderName = obj ? obj.senderName : null;
        this.message = obj ? obj.message : null;
        this.reactions = obj?.reactions || [];
        this.formattedTimestamp = '';
        this.displayDate = null;
        this.fileURL = obj ? obj.fileURL : null;
        this.receiverId = obj ? obj.receiverId : null;
        this.receiverName = obj ? obj.receiverName : null;
        this.conversation = obj ? obj.conversation : [];


        // Typensicherer Vergleich, um sowohl null als auch undefined abzudecken
        if (currentUserUid && this.senderId) {
            this.isOwnMessage = this.senderId === currentUserUid;
        }
    }
}