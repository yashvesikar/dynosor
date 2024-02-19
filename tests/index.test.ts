import { describe, expect, it } from "vitest";
import { ListTablesCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseService, createService } from "../src";
import { z } from "zod";

describe("CRUD operations on table", async () => {
  it("should list 1 test table", async () => {
    const client = new DynamoDBClient({ endpoint: "http://localhost:8000" });
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    expect(response.$metadata.httpStatusCode).toEqual(200);
    expect(response.TableNames).toEqual(["TestTable"]);
  });

  it("should put 1 item in the database", async () => {
    const entity = z.object({
      pk: z.string(),
      sk: z.string(),
    });

    const { entity: Item, service: ItemService } = createService(entity, {
      table: "TestTable",
      client: { endpoint: "http://localhost:8000" },
    });

    const response = await ItemService.put({ pk: "pk-1", sk: "sk-1" });
    expect(response).toEqual({ pk: "pk-1", sk: "sk-1" });
  });

  it("should put 1 item in the database using a custom service", async () => {
    const entity = z.object({
      pk: z.string(),
      sk: z.string(),
      custom: z.boolean().optional(),
    });
    class CustomService extends BaseService<typeof entity> {
      async customPut(Key: { pk: string; sk: string }) {
        return super.put({ ...Key, custom: true });
      }
    }

    const { entity: Item, service: ItemService } = createService(
      entity,
      {
        table: "TestTable",
        client: { endpoint: "http://localhost:8000" },
      },
      CustomService,
    );

    const response = await ItemService.customPut({ pk: "pk-1", sk: "sk-1" });
    expect(response).toEqual({ pk: "pk-1", sk: "sk-1", custom: true });
  });
});
