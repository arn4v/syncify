import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Base } from "./base.entity";

@Entity()
export class Session extends Base {
    @PrimaryGeneratedColumn("uuid")
    // @Column({ type: "text", unique: true })
    sessionId: string;

    @Column({ type: "int" })
    platform: number;

    @Column({ type: "text", unique: true })
    platformGroupId: string;

    @Column({ type: "text" })
    createdBy: string;

    @Column({ type: "text", nullable: true })
    admins: string;

    @Column({ type: "text" })
    members: string;

    @Column({ type: "boolean" })
    playInstant: boolean;
}
