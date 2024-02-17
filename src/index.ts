import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

/*
 * This is the base service class that all other database services should extend. It contains common
 * helper functions and methods for interacting with DynamoDB. It also contains the DynamoDB client.
 *
 * Note: This service should not depend on any other services to avoid circular dependencies.
 */
export class BaseService<S extends z.ZodTypeAny> {
  public client: DynamoDBClient;
  public documentClient: DynamoDBDocumentClient;
  public schema: z.ZodTypeAny;
  public table: string;
  /**
   * TODO: @yashvesikar I think it will be possible to do runtime validation that hash and range keys
   * are correctly passed in to service methods based on the describe table output for the supplied table.
   */
  // private tableSchema: DescribeTableOutput;

  constructor(schema: S, options: { table: string; client?: DynamoDBClientConfig }) {
    this.schema = schema;
    this.client = new DynamoDBClient(options.client ?? {});
    this.documentClient = DynamoDBDocumentClient.from(this.client);
    this.table = options.table;
  }

  /**
   * Helper function to define Dynamo update command arguments. Handles top-level and nested
   * object updates.
   *
   * Top-level update usage:
   *
   * ```ts
   * BaseService.getUpdateParams({ top: "level", updates: "work" });
   * ```
   *
   * Nested object update usage:
   *
   * ```ts
   * BaseService.getUpdateParams({ "nested.object": "updates" });
   * ```
   */
  static getUpdateParams(body: Record<string, any>): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, any>;
    ExpressionAttributeValues: Record<string, any>;
  } {
    let updateExpression: Array<string> = ["SET"];
    let expressionAttributeNames: Record<string, any> = {};
    let expressionAttributeValues: Record<string, any> = {};

    for (let key in body) {
      if (key.includes(".")) {
        // Handle nested object updates.
        const splitKey = key.split(".");
        updateExpression.push(`#${splitKey.join(".#")} = :${splitKey[splitKey.length - 1]},`);
        for (let keyFragment of splitKey) {
          expressionAttributeNames[`#${keyFragment}`] = keyFragment;
        }
        expressionAttributeValues[`:${splitKey[splitKey.length - 1]}`] = body[key];
      } else {
        if (body[key] === undefined || body[key] === null) continue;
        // Handle top-level object updates.
        updateExpression.push(`#${key} = :${key},`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = body[key];
      }
    }

    return {
      UpdateExpression: updateExpression.join(" ").slice(0, -1),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };
  }

  /**
   * Client method to get item from DynamoDB
   */
  public async get(Key: GetCommand["input"]["Key"]) {
    const command = new GetCommand({
      TableName: this.table,
      Key,
    });
    return this._get(command);
  }

  /**
   * Client method to put item in DynamoDB
   */
  public async put(entity: z.infer<S>) {
    const command = new PutCommand({
      TableName: this.table,
      Item: entity,
    });
    return this._put(command);
  }

  /**
   * Calls the DynamoDB get command and returns the parsed result via zod.
   */
  protected async _get(command: GetCommand): Promise<z.infer<S> | null> {
    const response = await this.documentClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to send command: ${response.$metadata.httpStatusCode}`);
    }
    if (!response.Item) {
      return null;
    }
    return this.schema.parse(response.Item);
  }

  /**
   * Calls the DynamoDB put command and returns the parsed result via zod.
   */
  protected async _put(command: PutCommand): Promise<z.infer<S> | undefined> {
    const response = await this.documentClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to send command: ${response.$metadata.httpStatusCode}`);
    }
    if (command.input.ReturnValues !== "ALL_OLD") {
      return this.schema.parse(command.input.Item);
    }
    return undefined;
  }

  /**
   * Calls the DynamoDB update command and returns the parsed result via zod. Unless specified,
   * the default return value is "ALL_NEW".
   */
  protected async _update(command: UpdateCommand): Promise<z.infer<S>> {
    // Default to returning record values after the update if not specified.
    if (!command.input.ReturnValues) command.input.ReturnValues = "ALL_NEW";
    const response = await this.documentClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to send command: ${response.$metadata.httpStatusCode}`);
    }
    return this.schema.parse(response.Attributes);
  }

  /**
   * Calls the DynamoDB delete command and returns the parsed result via zod. Unless specified,
   * the default return value is "ALL_OLD".
   */
  protected async _delete(command: DeleteCommand): Promise<z.infer<S>> {
    // Default to returning record values after the delete if not specified.
    if (!command.input.ReturnValues) command.input.ReturnValues = "ALL_OLD";
    const response = await this.documentClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to send command: ${response.$metadata.httpStatusCode}`);
    }
    return this.schema.parse(response.Attributes);
  }

  /**
   * Calls the DynamoDB query command and returns the parsed result via zod.
   */
  protected async _query(command: QueryCommand): Promise<Array<z.infer<S>>> {
    const response = await this.documentClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to send command: ${response.$metadata.httpStatusCode}`);
    }

    const result = this.schema.array().safeParse(response.Items);
    if (!result.success) {
      throw new Error(`Failed to parse response: ${result.error.message}`);
    } else {
      return result.data;
    }
  }
}

export function createService<T extends z.AnyZodObject>(
  entity: T,
  options: ConstructorParameters<typeof BaseService>["1"],
) {
  return {
    entity,
    service: new BaseService(entity, options),
  };
}
