## DynoSOR

_DynamoDB Structured Object Relations_

This is currently a POC for a better Typescript DynamoDB ORM-like service.

Goals:

1. Out of the box runtime validation with [zod](zod.dev).
2. Opinonated DynamoDB interface pattern.

### Getting started

Install the POC

```
npm i -S git+https://github.com/yashvesikar/dyno-orm.git
```

### Usage

#### Basic Usage

Simplest way to use is to pass the entity definition and DynamoDB client configurations directly into the `createService` function.

```
import { createService } from "dyno-orm";

const { entity: User, service: UserService } = createService(
    z.object({
        ... your attributes
    }),
    {
        client: {
            region: "us-east-1",
            ... your dynamodb client configurations
        }
    }
)
```

#### Extending BaseService

To customize and extend the `BaseService` the `createService` function takes an optional `service` parameter.

```
import { BaseService, createService } from "dyno-orm";

const entity = z.object({
        ... your attributes
    });

class CustomService extends BaseService<typeof entity>{
    async customGet() {
        // has access to BaseService attributes like this.table
        // can use super.get()
    }
}

// UserService will be an instance of CustomService
const { entity: User, service: UserService } = createService(
    entity,
    {
        client: {
            region: "us-east-1",
            ... your dynamodb client configurations
        }
    },
    CustomService
)
```

### Contributing

Not sure what is on the roadmap for this yet but if you have any ideas please reach out.

Run tests with by executing the following in seperate terminals:

```
docker compose up
npm run test
```
