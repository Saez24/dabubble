export class Channel {
    id: string;
    name: string;
    description: string;
    memberUids: string[];
    channelAuthorId: string;

    constructor(obj? : any) {
        this.id = obj ? obj.id : null;
        this.name = obj ? obj.name : null;
        this.description = obj ? obj.description : null;
        this.memberUids = Array.isArray(obj?.members) ? obj.members : []; 
        this.channelAuthorId = obj ? obj.channelAuthor : null;
    }
}
