import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMaintenanceRecordsTable1791897413987 implements MigrationInterface {
    name = 'CreateMaintenanceRecordsTable1791897413987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "maintenance_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "performedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "intervalMonths" integer NOT NULL, "nextMaintenanceAt" TIMESTAMP WITH TIME ZONE NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "equipmentId" uuid NOT NULL, CONSTRAINT "PK_287b838a22e8c8804262ccdb6a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "maintenance_records" ADD CONSTRAINT "FK_31417d03854066c2b0db76560d0" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maintenance_records" DROP CONSTRAINT "FK_31417d03854066c2b0db76560d0"`);
        await queryRunner.query(`DROP TABLE "maintenance_records"`);
    }

}
