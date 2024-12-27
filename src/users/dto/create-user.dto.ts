export class CreateUserDto {
    readonly username: string;
    readonly email: string;
    readonly password: string;
    readonly role: string;
    readonly about?: string;
    readonly location?: string;
    avatar?: string;
}