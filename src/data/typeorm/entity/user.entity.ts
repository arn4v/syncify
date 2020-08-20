import { Entity, Generated, Column } from "typeorm";
import { Base } from "./base.entity";

@Entity()
export class User extends Base {
    @Column()
    @Generated("uuid")
    syncifyUserId: string;

    @Column({ type: "text", unique: true })
    discordUserId: string;

    @Column({ type: "text", length: 100, nullable: true, unique: true })
    telegramUserId: string;

    @Column({ type: "text" })
    spotifyAccessToken: string;

    @Column({ type: "text", length: 100, unique: true })
    spotifyRefreshToken: string;
}
