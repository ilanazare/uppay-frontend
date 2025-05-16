export interface JwtPayload {
    sub: string;
    roles: string;
    exp: number;
    iat: number;
    iss: string;
}
