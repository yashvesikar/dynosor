import { createService } from "../src";
import { User as _User } from "./entities";

const options: Parameters<typeof createService>["1"] = {
  table: "MyTable",
  client: { region: "us-east-1" },
};

const { entity: User, service: UserService } = createService(_User, options);
export { User, UserService };
