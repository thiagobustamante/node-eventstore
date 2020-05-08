import { Message } from '../model/message';

/**
 * Publish notifications about the modifications in a event stream.
 * Can send {@link Message} to all
 * {@link Subscriber}s every time an {@link Event} is added to the
 * {@link EventStream}
 *
 */
export interface Publisher {
    /**
     * Publish the publisher to all subscribers
     * @param message The Message to be published
     */
    publish(message: Message): Promise<boolean>;
}


/**
 * A Handler for {@link Message}s published by {@link Publisher}s affter {@link Event}s are added
 * to {@link EventStream}
 * @param message The published Message
 */
export type Subscriber = (message: Message) => void;

/**
 * A subscription in the {@link EventStore} notification channel.
 * Can be used to remove the subscription to the publisher channel
 */
export interface Subscription {
    /**
     * Remove the subscription
     */
    remove(): Promise<void>;
}

/**
 * A class that can receive subscriptions for a notification channel
 */
export interface HasSubscribers {
    /**
     * Add a new subscription to notifications channel associated with the given aggregation.
     * @param aggregation The aggregation for the stream events
     * @param subscriber Declares the function to be called to handle new messages
     * @return A subscription. Can be used to remove the subscription to the publisher channel.
     */
    subscribe(aggregation: string, subscriber: Subscriber): Promise<Subscription>;
}
