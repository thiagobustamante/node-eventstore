# EventStore

[![Build Status](https://travis-ci.org/thiagobustamante/node-eventstore.svg?branch=master)](https://travis-ci.org/thiagobustamante/node-eventstore)
[![Mutation testing badge](https://badge.stryker-mutator.io/github.com/thiagobustamante/node-eventstore/master)](https://stryker-mutator.github.io)

## Usage

### Create the EventStore:

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