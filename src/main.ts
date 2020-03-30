import { DynamodbProvider, EventStore, InMemoryPublisher } from ".";

// tslint:disable:no-unused-expression
const eventStore = new EventStore(
    new DynamodbProvider(),
    new InMemoryPublisher()
);

const boletoStream = eventStore.getEventStream('boletos', 'BOLETO_CREATED');
boletoStream.addEvent({ data: 'My First Example' });
boletoStream.addEvent({ data: 'My Second Example' });
boletoStream.addEvent({ data: 'My Third Example' });