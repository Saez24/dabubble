type LoginStatus = 'loggedIn' | 'loggedOut' | 'inactive';

export class User {
    id: string | null;
    email: string | null;
    password: string | null;
    name: string | null;
    avatarPath: string | null;
    loginStatus: LoginStatus | null;

    constructor(obj?: any) {
        this.id = obj ? obj.id: null;
        this.email = obj ? obj.email: null;
        this.password = obj ? obj.password: null;
        this.name = obj ? obj.name: null;
        this.avatarPath = obj ? obj.avatarPath: null;
        this.loginStatus = obj ? obj.loginStatus: 'loggedOut';
    }
}