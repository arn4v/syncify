import { Entity, Generated, Column } from "typeorm";
import { Base } from "./base.entity";

@Entity()
export class Session extends Base {
    @Column({ type: "text", unique: true, nullable: false })
    @Generated("uuid")
    sessionId: string;

    @Column({ type: "int", nullable: false })
    platform: number;

    @Column({ type: "text", unique: true, nullable: false })
    platformGroupId: string;

    @Column({ type: "text", nullable: false })
    members: string;

    @Column({ type: "text", nullable: false })
    createdBy: string;
}
