import { Entity, PrimaryGeneratedColumn, Generated, Column } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Generated("uuid")
    syncifyUserId: string;

    @Column("int")
    discordUserId: number;

    // @Column()
    // telegramId: number;

    @Column("text")
    spotifyAccessToken: string;

    @Column("text")
    spotifyRefreshToken: string;

    @Column("text")
    createdAt: string;
}
