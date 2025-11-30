export interface UserUpdateDto {
    id: string;
    nickname: string;
    role: string;
}

export interface UserPasswordDto {
    origin_password: string;
    password: string;
    confirm_password: string;
}

export interface UserInfo {
    userId: string;
    tenantId: string;
    nickname: string;
    role: string;
}