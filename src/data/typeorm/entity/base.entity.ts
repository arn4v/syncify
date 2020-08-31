import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class Base {
    @CreateDateColumn()
    createdOn: string;

    @UpdateDateColumn()
    updatedOn: string;
}
