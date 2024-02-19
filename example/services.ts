import { BaseService, createService } from "../src";
import { Book, User } from "./entities";

const options: Parameters<typeof createService>["1"] = {
  table: "MyTable",
  client: { region: "us-east-1" },
};

class CustomUserService extends BaseService<typeof User> {
  async customGet() {}
  async customPut() {}
}

const { service: UserService } = createService(User, options, CustomUserService);
const { service: BookService } = createService(Book, options);

export { UserService, BookService };
