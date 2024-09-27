export class Channel {
    id: string;
    name: string;
    description: string | null;
    members: string[];
    newChannelName: any;
    channelAuthor: string | null;

    constructor(obj? : any) {
        this.id = obj ? obj.id : null;
        this.name = obj ? obj.name : null;
        this.description = obj ? obj.description : null;
        this.members = Array.isArray(obj?.members) ? obj.members : []; 
        this.channelAuthor = obj ? obj.channelAuthor : null;
    }
}
