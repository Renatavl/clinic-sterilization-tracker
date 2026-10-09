import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInstrumentsTable1791364780799 implements MigrationInterface {
    name = 'CreateInstrumentsTable1791364780799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."instruments_status_enum" AS ENUM('AVAILABLE', 'IN_STERILIZATION', 'STERILE')`);
        await queryRunner.query(`CREATE TABLE "instruments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "instrumentCode" character varying(100) NOT NULL, "status" "public"."instruments_status_enum" NOT NULL DEFAULT 'AVAILABLE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_23a4b035f6bc343aada541536aa" UNIQUE ("instrumentCode"), CONSTRAINT "PK_44d772c3199b38559c5fb666eb6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "instruments"`);
        await queryRunner.query(`DROP TYPE "public"."instruments_status_enum"`);
    }

}
