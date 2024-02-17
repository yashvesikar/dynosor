## Dyno-ORM

This is currently a POC for a better Typescript DynamoDB ORM-like service.

Goals:

1. Out of the box runtime validation with [zod](zod.dev).
2. Opinonated DynamoDB interface pattern.

### Getting started

Install the POC

```
npm i -S git+https://github.com/yashvesikar/dyno-orm.git
```

Create a new service using a zod entity based on your database record.

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

### Contributing

Not sure what is on the roadmap for this yet but if you have any ideas please reach out.

Run tests with by executing the following in seperate terminals:

```
docker compose up
npm run test
```
