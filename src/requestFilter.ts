import { parse as urlParse, format as urlFormat } from 'url';
import * as Crypto from 'crypto';
import Request from './request';
import { BloomFilter } from 'bloomfilter';

export default class RequestFilter {
    _bf: BloomFilter;

    constructor() {
        this._bf = new BloomFilter(32 * 1024, 16);
    }

    request_seen(request: Request): boolean {
        let finger = this.request_fingerprint(request);
        if (this._bf.test(finger)) {
            return true;
        }
        this._bf.add(finger);
        return false;
    }

    request_fingerprint(request: Request): string {
        let { protocol, host, pathname, query, hash } = urlParse(request.url, true);

        let sorted_query: { [key: string]: string } = {};
        for (let [key, val] of Object.entries(query).sort()) {
            sorted_query[key] = val as string;
        }
        let canibalize_url = urlFormat({
            protocol,
            host,
            pathname,
            query: sorted_query,
            hash
        });

        return Crypto.createHmac('sha1', 'xz61S61')
            .update(canibalize_url)
            .update(request.method)
            .update(JSON.stringify(request.data))
            .update(JSON.stringify(request.meta))
            .digest('hex');
    }
}