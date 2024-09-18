export class Channel {
    id: string | null;
    name: string | null;
    users: string[];
    messages: string[];


    constructor(obj?: any) {
        this.id = obj ? obj.id : null;
        this.name = obj ? obj.name : null;
        this.users = obj ? obj.users : [];
        this.messages = obj ? obj.messages : [];
    }
}