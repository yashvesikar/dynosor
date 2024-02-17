import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { CreateTableCommand, DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

beforeEach(() => {
  vi.resetAllMocks();
});

beforeAll(async () => {
  const client = new DynamoDBClient({ endpoint: "http://localhost:8000" });
  const command = new CreateTableCommand({
    TableName: "TestTable",
    AttributeDefinitions: [
      {
        AttributeName: "pk",
        AttributeType: "S",
      },
      {
        AttributeName: "sk",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "pk",
        KeyType: "HASH",
      },
      {
        AttributeName: "sk",
        KeyType: "RANGE",
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
  });

  const response = await client.send(command);
  console.log("CREATED TestTable");
});

afterAll(async () => {
  const client = new DynamoDBClient({ endpoint: "http://localhost:8000" });
  const command = new DeleteTableCommand({
    TableName: "TestTable",
  });
  const response = await client.send(command);
  console.log("DELETED TestTable");
});
