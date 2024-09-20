
export class Message {
    timestamp(timestamp: any): string {
        throw new Error('Method not implemented.');
    }
    messageId: string;
    senderID: string | null;
    senderName: string | null;
    message: string | null;
    reaction: string | null;
    answers: number | [];
    isOwnMessage: boolean;
    formattedTimestamp: string;


    constructor(obj?: any) {
        this.messageId = obj ? obj.messageId : null;
        this.senderID = obj ? obj.senderID : null;
        this.senderName = obj ? obj.senderName : null;
        this.message = obj ? obj.message : null;
        this.reaction = obj ? obj.reaction : null;
        this.answers = obj ? obj.answers : [];
        this.isOwnMessage = false;
        this.formattedTimestamp = '';
    }
}