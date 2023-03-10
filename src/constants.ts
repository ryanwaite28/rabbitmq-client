import { ConsumeMessage } from "amqplib";



export enum ContentTypes {
  JSON = 'application/json',
  TEXT = 'text/plain',
  STREAM = 'application/octet-stream'
}


export type ContentType = 'application/json' | 'application/octet-stream' | 'text/plain' | null;
export interface QueueExchangeBinding { queue: string, exchange: string, routingKey: string }
export interface MapType<T> { [key:string]: T }
export type EventMessage<T = any> = { data: T, message: ConsumeMessage };