# RabbitMQ Client

Simple Rabbit MQ Wrapper of <a href="https://www.npmjs.com/package/amqplib" title="npm library">`amqplib`</a>.




Sender:

```typescript
const rmqClient = new RabbitMQClient({
  connection_url: process.env['RABBIT_MQ_URL'],
  delayStart: 5000,
  prefetch: 1,
  retryAttempts: 3,
  retryDelay: 3000,
  queues: [
    { name: Queues.USER_MESSAGES, messageTypes: Object.values(UsersQueueMessageTypes), options: { durable: true } },
    { name: Queues.USER_EVENTS, messageTypes: Object.values(UsersQueueEventTypes), options: { durable: true } },
  ],
  exchanges: [
    { name: Exchanges.USER_MESSAGES, type: 'direct', options: { durable: true } },
    { name: Exchanges.USER_EVENTS, type: 'direct', options: { durable: true } },
  ],
  bindings: [
    { queue: Queues.USER_MESSAGES, exchange: Exchanges.USER_MESSAGES, routingKey: RoutingKeys.MESSAGE },
    { queue: Queues.USER_EVENTS, exchange: Exchanges.USER_EVENTS, routingKey: RoutingKeys.EVENT },
  ],
});

rmqClient.onQueue(Queues.USER_EVENTS).handle(UsersQueueEventTypes.USERS_FETCHED).subscribe({
  next: (event: EventMessage) => {
    const data = event.data;
    console.log(`[${UsersQueueEventTypes.USERS_FETCHED}] Received users fetched event:`, { data });
    // rmqClient.ack(event.message);
  }
});

rmqClient.sendMessage({
  queue: Queues.USER_MESSAGES,
  data: { name: 'John Doe', email: 'test@test.com', password: '<password>' },
  publishOptions: {
    type: UsersQueueMessageTypes.CREATE_USER,
    contentType: ContentTypes.JSON,
    correlationId: Date.now().toString()
  }
});
```


Receiver:
```typescript
const rmqClient = new RabbitMQClient({
  connection_url: process.env['RABBIT_MQ_URL'] || '',
  delayStart: 5000,
  prefetch: 1,
  retryAttempts: 3,
  retryDelay: 3000,
  queues: [
    { name: Queues.USER_MESSAGES, messageTypes: Object.values(UsersQueueMessageTypes), options: { durable: true } },
    { name: Queues.USER_EVENTS, messageTypes: Object.values(UsersQueueEventTypes), options: { durable: true } },
  ],
  exchanges: [
    { name: Exchanges.USER_MESSAGES, type: 'direct', options: { durable: true } },
    { name: Exchanges.USER_EVENTS, type: 'direct', options: { durable: true } },
  ],
  bindings: [
    { queue: Queues.USER_MESSAGES, exchange: Exchanges.USER_MESSAGES, routingKey: RoutingKeys.MESSAGE },
    { queue: Queues.USER_EVENTS, exchange: Exchanges.USER_EVENTS, routingKey: RoutingKeys.EVENT },
  ],
});



const usersCreated: any[] = [];

rmqClient.onQueue(Queues.USER_MESSAGES).handle(UsersQueueMessageTypes.CREATE_USER).subscribe({
  next: (event: EventMessage) => {
    const data = event.data;
    console.log(`[${UsersQueueMessageTypes.CREATE_USER}] Received create user message:`, { data });

    const { name, email, password } = data;
    const user = { name, email, password: hashSync(password), id: Date.now() };
    console.log({ user });
    if (user) {
      usersCreated.push(user);
      console.log()
    }

    rmqClient.ack(event.message);
    
    setTimeout(() => {
      console.log(`[${UsersQueueEventTypes.USER_CREATED}] handled create user message, emitting event...`);
      rmqClient.publishEvent({
        exchange: Exchanges.USER_EVENTS,
        routingKey: RoutingKeys.EVENT,
        data: user,
        publishOptions: {
          type: UsersQueueEventTypes.USER_CREATED,
          contentType: ContentTypes.JSON,
          correlationId: event.message.properties.correlationId
        }
      });
    }, 5000);
  }
});
```