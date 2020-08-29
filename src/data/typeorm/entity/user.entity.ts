import { Entity, Generated, Column, PrimaryGeneratedColumn } from "typeorm";
import { Base } from "./base.entity";

@Entity()
export class User extends Base {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Generated("uuid")
    syncifyUserId: string;

    @Column({ type: "text", unique: true })
    discordUserId: string;

    @Column({ type: "text", nullable: true, unique: true })
    telegramUserId: string;

    @Column({ type: "text" })
    spotifyAccessToken: string;

    @Column({ type: "text", unique: true })
    spotifyRefreshToken: string;
}
