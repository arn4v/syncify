import { Entity, Generated, Column } from "typeorm";
import { Base } from "./base.entity";

@Entity()
export class Session extends Base {
    @Column({ type: "text", unique: true })
    @Generated("uuid")
    sessionId: string;

    @Column({ type: "int" })
    platform: number;

    @Column({ type: "text", unique: true })
    platformGroupId: string;

    @Column({ type: "text" })
    createdBy: string;

    // @Column({ type: "text", nullable: true })
    // admins: string;

    @Column({ type: "text" })
    members: string;

    // @Column({ type: "boolean", nullable: true })
    // playPauseState: boolean;

    // @Column({ type: "text", nullable: true })
    // queue: string;
}
