
export class Message {
    id: string | null;
    senderID: string | null;
    message: string | null;
    reaction: string | null;
    answers: number | [];


    constructor(obj?: any) {
        this.id = obj ? obj.id : null;
        this.senderID = obj ? obj.senderID : null;
        this.message = obj ? obj.message : null;
        this.reaction = obj ? obj.reaction : null;
        this.answers = obj ? obj.answers : [];
    }
}