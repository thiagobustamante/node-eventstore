// tslint: disable: no - unused - expression;

import { EventStore, EventStream, InMemoryPublisher } from ".";
import { MongoProvider } from "./provider/mongo";


function testMongoDBProvider() {
    const eventStore = new EventStore(
        new MongoProvider('mongodb://localhost:27017/eventstore'),
        new InMemoryPublisher()
    );
    const boletoStream = createBoletosStream(eventStore);
    boletoStream.getEvents().then(data => console.log(`Events from Boleto Stream: ${JSON.stringify(data)}`));

    eventStore.getStreams('boletos').then(data => console.log(`Streams related to aggregation boletos: ${JSON.stringify(data)}`));
    eventStore.getAggregations().then(data => console.log(`Aggragations: ${JSON.stringify(data)}`));

}

function createBoletosStream(eventStore: EventStore): EventStream {
    const boletoStream = eventStore.getEventStream('BOLETO_CREATED', 'boletos');
    boletoStream.addEvent({ data: 'My First Example' });
    boletoStream.addEvent({ data: 'My Second Example' });
    boletoStream.addEvent({ data: 'My Third Example' });

    return boletoStream;
}

testMongoDBProvider();