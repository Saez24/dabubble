
export class Message {
    messageId: string | null;
    senderID: string | null;
    message: string | null;
    reaction: string | null;
    answers: number | [];


    constructor(obj?: any) {
        this.messageId = obj ? obj.messageId : null;
        this.senderID = obj ? obj.senderID : null;
        this.message = obj ? obj.message : null;
        this.reaction = obj ? obj.reaction : null;
        this.answers = obj ? obj.answers : [];
    }
}