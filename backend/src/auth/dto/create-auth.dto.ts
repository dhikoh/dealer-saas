export class CreateAuthDto {
    email: string;
    password: string;
    username: string; // Changed from name to username
    role?: string;
}
