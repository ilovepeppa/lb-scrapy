import Response from './response';
import Request from './request';
import Engine from './engine';

export default class Spider {
    settings: { [key: string]: any } = {};
    start_urls: string[] = [];

    *start_request() {
        for (let url of this.start_urls) {
            yield new Request({
                url: url,
                callback: this.parse
            });
        }
    }

    parse(response: Response) { }

    start() {
        let engine = new Engine(this);
        engine.start();
    }
}