export class Channel {
    id: number | null = null;
    name: string = '';
    description: string = '';
    users: string[] = [];
    messages: string[] = [];

    constructor(id: number | null = null, name: string = '', description: string = '', users: string[] = [], messages: string[] = []) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.users = users;
        this.messages = messages;
    }
}
