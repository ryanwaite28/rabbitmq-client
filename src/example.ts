import { MapType } from "./constants";

export enum RoutingKeys {
  MESSAGE = 'MESSAGE', // instruction to do something
  EVENT = 'EVENT', // results of instruction
}

export enum Queues {
  USER_MESSAGES = 'USER_MESSAGES_QUEUE',
  USER_EVENTS = 'USER_EVENTS_QUEUE'
}

export enum Exchanges {
  USER_MESSAGES = 'USER_MESSAGES_EXCHANGE',
  USER_EVENTS = 'USER_EVENTS_EXCHANGE',
}




export enum UsersQueueMessageTypes {
  CREATE_USER = 'CREATE_USER',
  FETCH_USERS = "FETCH_USERS",
  FETCH_USER_BY_ID = "FETCH_USER_BY_ID"
}




export enum UsersQueueEventTypes {
  USER_CREATED = 'USER_CREATED',
  USERS_FETCHED = "USERS_FETCHED",
  USER_FETCHED_BY_ID = "USER_FETCHED_BY_ID"
}

export const mapify = <T> (list: T[], key: string | number): MapType<T> => {
  return list.reduce((map: MapType<T>, item: T) => {
    map[ item[key] ] = item;
    return map;
  }, {} as MapType<T>);
};

export const wait = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};


export function shuffle(array) {
  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}