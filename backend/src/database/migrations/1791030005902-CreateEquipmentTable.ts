import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEquipmentTable1791030005902 implements MigrationInterface {
    name = 'CreateEquipmentTable1791030005902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."equipment_type_enum" AS ENUM('AUTOCLAVE', 'ULTRASONIC_CLEANER', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."equipment_status_enum" AS ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "equipment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "serialNumber" character varying(100) NOT NULL, "type" "public"."equipment_type_enum" NOT NULL, "manufacturer" character varying(100), "model" character varying(100), "status" "public"."equipment_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_4dc0c52dcbe9b9efb1eeda126e1" UNIQUE ("serialNumber"), CONSTRAINT "PK_0722e1b9d6eb19f5874c1678740" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "equipment"`);
        await queryRunner.query(`DROP TYPE "public"."equipment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."equipment_type_enum"`);
    }

}
