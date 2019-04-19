import Request from './request';
import RequestFilter from './requestFilter';
import TaskQueue from './taskQueue';

export abstract class Schedular {
    request_filter: RequestFilter = new RequestFilter();

    enqueue_request(request: Request): boolean {
        if (this.request_filter.request_seen(request) && !request.dont_filter) {
            console.log('Filtered duplicate request');
            return false;
        }
        this._add(request);
        return true;
    }

    abstract _add(request: Request): void;

    abstract has_next(): boolean;

    abstract next(): Request | undefined;

    abstract length(): number;
}


export default class QueueScheduler extends Schedular {
    queue: TaskQueue = new TaskQueue();

    _add(request: Request): void {
        this.queue.push(request);
    }
    has_next(): boolean {
        return !this.queue.empty();
    }
    next(): Request | undefined {
        return this.queue.pop();
    }
    length(): number {
        return this.queue.length();
    }
}