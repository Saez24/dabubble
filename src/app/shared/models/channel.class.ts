export class Channel {
    id: string;
    name: string | null;
    description: string | null;
    users: string[] | [];
    newChannelName: any;
    channelAuthor: string | null;

    constructor(obj? : any) {
        this.id = obj ? obj.id : null;
        this.name = obj ? obj.name : null;
        this.description = obj ? obj.description : null;
        this.users = obj ? obj.users : [];
        this.channelAuthor = obj ? obj.channelAuthor : null;
    }
}
