export class Channel {
    id: number | null = null;
    name: string | null = '';
    description: string[] = [];
    users: string[] | any[] = [];
    messages: string[] = [];

    constructor() { }
}