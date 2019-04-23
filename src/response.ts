import * as cheerio from 'cheerio';
import { resolve as urlResolve } from 'url';

export default class Response {
    selector: any;

    constructor(public text: string,
        public status: number = 200,
        public url: string = '',
        public headers: { [key: string]: any } = {},
        public cookies: { [key: string]: any } = {},
        public meta: { [key: string]: any } = {}) {
        this.selector = cheerio.load(text);
    }

    static from_response(response: any) {
        let cookies_dict: { [key: string]: string } = {};

        if (response.headers['set-cookie']) {
            let cookies = response.headers['set-cookie'].map((cookie: string) => {
                cookie = cookie.split(';')[0]
                let arr = cookie.match(/(\S+?)=(\S+)/)
                return arr!.slice(1, 3);
            });
            for (let [key, val] of cookies) {
                cookies_dict[key] = val;
            }
        }

        return new Response(response.body, +response.statusCode, response.request.uri.href,
            response.headers, cookies_dict);
    }

    urljoin(url: string) {
        return urlResolve(this.url, url);
    }
}