type loginState = 'loggedIn' | 'loggedOut' | 'inactive';

export class User {
    id: string | null;
    email: string | null;
    name: string | null;
    avatarPath: string | null;
    loginState: loginState | null;

    constructor(obj?: any) {
        this.id = obj ? obj.id: null;
        this.email = obj ? obj.email: null;
        this.name = obj ? obj.name: null;
        this.avatarPath = obj ? obj.avatarPath: null;
        this.loginState = obj ? obj.loginStatus: 'loggedOut';
    }
}