import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttachments1792000889724 implements MigrationInterface {
  name = 'CreateAttachments1792000889724';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying(255) NOT NULL, "storedName" character varying(255) NOT NULL, "mimeType" character varying(100) NOT NULL, "size" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "maintenanceRecordId" uuid, "sterilizationBatchId" uuid, CONSTRAINT "UQ_7e4d0b39ec97b1c3eda954a2081" UNIQUE ("storedName"), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_eefc02a4f0daf25e9edd4e26bf9" FOREIGN KEY ("maintenanceRecordId") REFERENCES "maintenance_records"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_4fa26ec2563d0f368b746c299f2" FOREIGN KEY ("sterilizationBatchId") REFERENCES "sterilization_batches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_4fa26ec2563d0f368b746c299f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_eefc02a4f0daf25e9edd4e26bf9"`,
    );
    await queryRunner.query(`DROP TABLE "attachments"`);
  }
}
