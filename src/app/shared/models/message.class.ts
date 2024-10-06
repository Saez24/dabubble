
export class Message {
    timestamp(timestamp: any): string {
        throw new Error('Method not implemented.');
    }
    messageId: string;
    channelId: string | null;
    senderID: string | null;
    senderName: string | null;
    message: string | null;
    reactions: { emoji: string; senderName: string; count: number }[] = [];
    answers: Message[];
    formattedTimestamp: string;
    isOwnMessage: boolean = false;
    displayDate: string | null;
    senderAvatar: string | null | undefined;
    parentMessageId: string | null;
    fileURL: string | null;


    constructor(obj?: any, currentUserUid?: string | null) {
        this.messageId = obj ? obj.messageId : null;
        this.channelId = obj ? obj.channelId : null;
        this.senderID = obj ? obj.senderID : null;
        this.senderName = obj ? obj.senderName : null;
        this.message = obj ? obj.message : null;
        this.reactions = obj?.reactions || [];
        this.answers = obj && obj.answers ? obj.answers.map((answer: any) => new Message(answer)) : [];
        this.formattedTimestamp = '';
        this.displayDate = null;
        this.parentMessageId = obj ? obj.parentMessageId : null; //Um ThreadNachricht dem ausgewaehlten Kommentar zuzuweisen!
        this.fileURL = obj ? obj.fileURL : null;




        // Typensicherer Vergleich, um sowohl null als auch undefined abzudecken
        if (currentUserUid && this.senderID) {
            this.isOwnMessage = this.senderID === currentUserUid;
        }
    }
}