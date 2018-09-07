# Event.Store

[![npm version](https://badge.fury.io/js/%40eventstore.net%2Fevent.store.svg)](https://badge.fury.io/js/%40eventstore.net%2Fevent.store)
[![Build Status](https://travis-ci.org/thiagobustamante/node-eventstore.svg?branch=master)](https://travis-ci.org/thiagobustamante/node-eventstore)
[![Mutation testing badge](https://badge.stryker-mutator.io/github.com/thiagobustamante/node-eventstore/master)](https://stryker-mutator.github.io)
[![Coverage Status](https://coveralls.io/repos/github/thiagobustamante/node-eventstore/badge.svg?branch=master)](https://coveralls.io/github/thiagobustamante/node-eventstore?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/thiagobustamante/node-eventstore/badge.svg?targetFile=package.json)](https://snyk.io/test/github/thiagobustamante/node-eventstore?targetFile=package.json)



## Installing

```sh
npm install --save @eventstore.net/event.store
```

## Usage

### Create the Event Store:

```javascript
const eventStore = new EventStore(
                  new InMemoryProvider(), // The persistence provider. Could use different providers, like MongoDB etc
                  new InMemoryPublisher()); // Opcional. Support different publishers, like RabbitmqPublisher, RedisPublisher etc
```

### Reading and writing events:

Accessing an event stream:

```javascript
const ordersStream = eventStore.getEventStream('orders', '1234567');
```

Adding events to the stream:

```javascript
const ordersStream = eventStore.getEventStream('orders', '1234567');
ordersStream.addEvent({ payload: 'My Event Payload' }); // Could pass anything here
```

Loading events from the stream:

```javascript
const ordersStream = eventStore.getEventStream('orders', '1234567');
const events = await ordersStream.getEvents();
const order = ordersAggregation.loadFromHistory(events)
```

### Reacting to events:

Listening for new events in event streams:

```javascript
eventStore.subscribe('orders', message => {
    console.log(message.aggregation);
    console.log(message.streamId);
    console.log(message.event.payload);
});
```

Removing the subscription to eventStore channels:

```javascript
const subscription = await eventStore.subscribe('orders', message => {
    console.log(message.aggregation);
    console.log(message.streamId);
    console.log(message.event.payload);
});

// ...
subscription.remove();
 
```