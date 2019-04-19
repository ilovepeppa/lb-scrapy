import { Spider, Request, Response } from '../index';

class CookieTest extends Spider {
    name = 'cookie';

    *start_request() {
        yield new Request({
            url: 'http://httpbin.org/status/500',
            callback: this.parse,
            headers: {
                'User-Agent': 'baiduspider+'
            }
        });
    }

    parse(response: Response) {
        console.log(response);
    }
}

let spider = new CookieTest();
spider.start();