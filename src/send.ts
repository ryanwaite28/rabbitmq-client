import { RabbitMQClient } from "./client";
import {
  ContentTypes,
  EventMessage
} from "./constants";
import { Queues, UsersQueueMessageTypes, UsersQueueEventTypes, Exchanges, RoutingKeys } from "./example";
import { shuffle } from "./example";



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




const userIds: number[] = [];

rmqClient.onQueue(Queues.USER_EVENTS).handle(UsersQueueEventTypes.USERS_FETCHED).subscribe({
  next: (event: EventMessage) => {
    const data = event.data;
    console.log(`[${UsersQueueEventTypes.USERS_FETCHED}] Received users fetched event:`, { data });
    // rmqClient.ack(event.message);
  }
});

// rmqClient.onQueue(Queues.USER_EVENTS).handle(UsersQueueEventTypes.USER_FETCHED_BY_ID).subscribe({
//   next: (event: EventMessage) => {
//     const data = event.data;
//     console.log(`[${UsersQueueEventTypes.USER_FETCHED_BY_ID}] Received user fetched by id event:`, { data });
//     rmqClient.ack(event.message);
//   }
// });

rmqClient.onQueue(Queues.USER_EVENTS).handle(UsersQueueEventTypes.USER_CREATED).subscribe({
  next: (event: EventMessage) => {
    const data = event.data;
    console.log(`[${UsersQueueEventTypes.USER_CREATED}] Received user created event:`, { data });
    rmqClient.ack(event.message);
    userIds.push(data.id);
    console.log({ userIds });
    shuffle(userIds);
  }
});




setInterval(() => {

  if (!userIds.length) {
    return;
  }
  
  console.log(`[${UsersQueueMessageTypes.FETCH_USER_BY_ID}] Sending fetch user by id message...`);
  rmqClient.sendMessage({
    queue: Queues.USER_MESSAGES,
    data: { id: userIds[0] },
    publishOptions: {
      type: UsersQueueMessageTypes.FETCH_USER_BY_ID,
      contentType: ContentTypes.JSON,
      correlationId: Date.now().toString(),
      replyTo: Queues.USER_EVENTS
    }
  })
  .then((event: EventMessage | null) => {
    if (event) {
      const data = event.data;
      console.log(`[${UsersQueueEventTypes.USER_FETCHED_BY_ID}] Received user fetched by id event in .then call -------:`, { data });
      rmqClient.ack(event.message);
    }
  });

}, 4000);

setInterval(() => {
  console.log(`[${UsersQueueMessageTypes.CREATE_USER}] Sending create user message...`);

  rmqClient.sendMessage({
    queue: Queues.USER_MESSAGES,
    data: { name: 'John Doe', email: 'test@test.com', password: '<password>' },
    publishOptions: {
      type: UsersQueueMessageTypes.CREATE_USER,
      contentType: ContentTypes.JSON,
      correlationId: Date.now().toString()
    }
  });

}, 15000);

setInterval(() => {
  console.log(`[${UsersQueueMessageTypes.FETCH_USERS}] Sending fetch users message...`);

  rmqClient.sendMessage({
    queue: Queues.USER_MESSAGES,
    data: '',
    publishOptions: {
      type: UsersQueueMessageTypes.FETCH_USERS,
      contentType: ContentTypes.TEXT,
      correlationId: Date.now().toString()
    }
  });

}, 19000);
