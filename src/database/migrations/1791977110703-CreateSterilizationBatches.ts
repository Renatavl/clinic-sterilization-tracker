import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSterilizationBatches1791977110703 implements MigrationInterface {
    name = 'CreateSterilizationBatches1791977110703'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."sterilization_batches_status_enum" AS ENUM('DRAFT', 'IN_PROGRESS', 'PASSED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "sterilization_batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."sterilization_batches_status_enum" NOT NULL DEFAULT 'DRAFT', "startedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "equipmentId" uuid NOT NULL, CONSTRAINT "PK_9fe7ded7928882da15864ec9b65" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sterilization_batch_instruments" ("batchId" uuid NOT NULL, "instrumentId" uuid NOT NULL, CONSTRAINT "PK_ee03e1f187a6a991d4f9b85ed5f" PRIMARY KEY ("batchId", "instrumentId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b3da3727724f8e5075e0c89433" ON "sterilization_batch_instruments"  ("batchId") `);
        await queryRunner.query(`CREATE INDEX "IDX_76f060f438e4bd8432ccbe8d45" ON "sterilization_batch_instruments"  ("instrumentId") `);
        await queryRunner.query(`ALTER TABLE "sterilization_batches" ADD CONSTRAINT "FK_a107b66ce07a5cd24a2f09a66d5" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sterilization_batch_instruments" ADD CONSTRAINT "FK_b3da3727724f8e5075e0c89433e" FOREIGN KEY ("batchId") REFERENCES "sterilization_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sterilization_batch_instruments" ADD CONSTRAINT "FK_76f060f438e4bd8432ccbe8d45a" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sterilization_batch_instruments" DROP CONSTRAINT "FK_76f060f438e4bd8432ccbe8d45a"`);
        await queryRunner.query(`ALTER TABLE "sterilization_batch_instruments" DROP CONSTRAINT "FK_b3da3727724f8e5075e0c89433e"`);
        await queryRunner.query(`ALTER TABLE "sterilization_batches" DROP CONSTRAINT "FK_a107b66ce07a5cd24a2f09a66d5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_76f060f438e4bd8432ccbe8d45"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3da3727724f8e5075e0c89433"`);
        await queryRunner.query(`DROP TABLE "sterilization_batch_instruments"`);
        await queryRunner.query(`DROP TABLE "sterilization_batches"`);
        await queryRunner.query(`DROP TYPE "public"."sterilization_batches_status_enum"`);
    }

}
