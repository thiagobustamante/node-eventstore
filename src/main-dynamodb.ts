
import { DynamodbProvider, EventStore } from ".";
import { SQSPublisher } from "./publisher/sqs";


function testAWSES() {
    const awsConfig = { region: 'us-east-1' };
    const eventStore = new EventStore(
        new DynamodbProvider(awsConfig),
        new SQSPublisher('https://sqs.us-east-1.amazonaws.com/773374622004/BOLETOCREATEDBOLETOS.fifo', awsConfig)
    );

    const boletoStream = eventStore.getEventStream('BOLETO_CREATED', 'boletos');
    boletoStream.addEvent({ data: 'My First Example' });
    boletoStream.addEvent({ data: 'My Second Example' });
    boletoStream.addEvent({ data: 'My Third Example' });

    boletoStream.getEvents().then(data => console.log(JSON.stringify(data)));
    eventStore.getAggregations().then(data => console.log(`Aggregations: ${JSON.stringify(data)}`));
    eventStore.getStreams('BOLETO_CREATED').then(data => console.log(`Streams: ${JSON.stringify(data)}`));

    // eventStore.subscribe(boletoStream.aggregation, message => {
    //     console.log(`Processing message: ${JSON.stringify(message)}`);
    // });
}

testAWSES();