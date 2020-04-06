import { DynamodbProvider, EventStore, InMemoryPublisher } from ".";
// import { MongoProvider } from "./provider/mongo";

// tslint: disable: no - unused - expression;
const eventStore = new EventStore(
    new DynamodbProvider({ region: 'us-east-1' }),
    new InMemoryPublisher()
);

const boletoStream = eventStore.getEventStream('BOLETO_CREATED', 'boletos');
boletoStream.addEvent({ data: 'My First Example' });
boletoStream.addEvent({ data: 'My Second Example' });
boletoStream.addEvent({ data: 'My Third Example' });
// boletoStream.getEvents().then(data => console.log(JSON.stringify(data)));
eventStore.getAggregations().then(data => console.log(JSON.stringify(data)));
eventStore.getStreams('BOLETO_CREATED').then(data => console.log(JSON.stringify(data)));

// const eventStore = new EventStore(
//     new MongoProvider('mongodb://localhost:27017/eventstore'),
//     new InMemoryPublisher()
// );
// :1585840322042
// :1585840322065
// const boletoStream = eventStore.getEventStream('boletos', 'BOLETO_CREATED');
// boletoStream.addEvent({ data: 'My First Example' });
// boletoStream.addEvent({ data: 'My Second Example' });
// boletoStream.addEvent({ data: 'My Third Example' });