import { Entity, PrimaryGeneratedColumn, Generated, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Generated("uuid")
    syncifyUserId: string;

    @Column()
    discordUserId: string;

    @Column()
    spotifyAccessToken: string;

    @Column()
    spotifyRefreshToken: string;

    @CreateDateColumn()
    createdAt: string;
}
// @Column()
// telegramId: number;
