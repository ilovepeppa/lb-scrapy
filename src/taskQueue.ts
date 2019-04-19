import Request from './request';

export default class TaskQueue {
    _queue: Request[] = []

    push(request: Request): void {
        this._queue.push(request);
    }

    pop(): Request | undefined {
        return this._queue.pop();
    }

    empty(): boolean {
        return this._queue.length === 0;
    }

    length(): number {
        return this._queue.length;
    }
}