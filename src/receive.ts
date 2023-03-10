import { RabbitMQClient } from "./client";
import {
  ContentTypes,
  EventMessage
} from "./constants";
import { hashSync } from 'bcrypt-nodejs';
import { Queues, UsersQueueMessageTypes, UsersQueueEventTypes, Exchanges, RoutingKeys } from "./example";



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

rmqClient.onQueue(Queues.USER_MESSAGES).handle(UsersQueueMessageTypes.FETCH_USER_BY_ID).subscribe({
  next: (event: EventMessage) => {
    const data = event.data;
    console.log(`[${UsersQueueMessageTypes.FETCH_USER_BY_ID}] Received fetch user by id message:`, { data });

    const user = usersCreated.find(u => u.id === data.id);
    rmqClient.ack(event.message);
    
    setTimeout(() => {
      console.log(`[${UsersQueueEventTypes.USER_FETCHED_BY_ID}] handled create user message, emitting event...`);
      rmqClient.publishEvent({
        exchange: Exchanges.USER_EVENTS,
        routingKey: RoutingKeys.EVENT,
        data: user || null,
        publishOptions: {
          type: UsersQueueEventTypes.USER_FETCHED_BY_ID,
          contentType: ContentTypes.JSON,
          correlationId: event.message.properties.correlationId,
        }
      });
    }, 2000);
  }
});


rmqClient.onQueue(Queues.USER_MESSAGES).handle(UsersQueueMessageTypes.FETCH_USERS).subscribe({
  next: (event: EventMessage) => {
    const data = event.data;
    console.log(`[${UsersQueueMessageTypes.FETCH_USERS}] Received fetch users message:`, { data, usersCreated });

    rmqClient.ack(event.message);
    
    setTimeout(() => {
      console.log(`[${UsersQueueEventTypes.USERS_FETCHED}] handled fetched users message, emitting event.`);
      rmqClient.publishEvent({
        exchange: Exchanges.USER_EVENTS,
        routingKey: RoutingKeys.EVENT,
        data: { users: usersCreated },
        publishOptions: {
          type: UsersQueueEventTypes.USERS_FETCHED,
          contentType: ContentTypes.JSON,
          correlationId: event.message.properties.correlationId
        }
      });
    }, 6000);
  }
});
