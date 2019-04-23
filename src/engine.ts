import * as async from 'async';
import Request from './request';
import Response from './response';
import Spider from './spider';
import Schedular from './schedular';
import Downloader from './downloader';
import Settings from './settings/settings';
import JsonPipeline from './itemPipeline/json';
import logger from './logger';

function sleep(delay: number) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, delay);
    });
}

export default class Engine {
    schedular: Schedular = new Schedular();

    downloader: Downloader = new Downloader();

    pool = async.queue(async (request: Request, callback: () => void) => {
        await this.process_request(request);
        await sleep(Settings.getInstance().get('DOWNLOAD_DELAY') * 1000);
        callback();
    }, Settings.getInstance().get('MAX_REQUEST_SIZE'));

    methods: { [key: string]: any[] } = {};


    constructor(public spider: Spider) {
        this.pool.drain = this.spider_finished;
        Settings.getInstance().load_settings(spider.settings || {});
        this.add_item_pipelines();
    }

    add_item_pipelines() {
        let pipelines = Settings.getInstance().get('ITEM_PIPELINES');
        pipelines.sort((x: { [key: string]: any }, y: { [key: string]: any }) =>
            (y['priority'] as number) - (x['priority'] as number));
        this.methods['process_item'] = pipelines.map((item: { [key: string]: any }) => {
            return (new item.class()).process_item;
        });
        // required pipeline
        this.methods['process_item'].unshift((new JsonPipeline()).process_item);
    }

    start() {
        logger.info('Spider opened');
        for (let request of this.spider.start_request()) {
            this.crawl(request);
        }
        while (this.schedular.has_next()) {
            let request: Request = this.schedular.next() as Request;
            this.pool.push(request, function () { })
        }
    }

    crawl(request: Request) {
        if (this.schedular.enqueue_request(request)) {
            request = this.schedular.next() as Request;
            this.pool.push(request, function () { })
        }
    }

    spider_finished() {
        logger.info('Closing spider.(finished)');
    }

    async process_request(request: Request) {
        let response = await this.download(request);
        this.handle_download_output(response, request);
    }

    handle_download_output(response: any, request: Request) {
        if (!response) {
            return;
        }

        if (response.constructor === Request) {
            this.crawl(response)
            return;
        }

        logger.info(`Crawled (${(response as Response).status}) <${request.method} ${(response as Response).url}>`)
        let callback = request.callback || this.spider.parse;
        let result = (callback.bind(this.spider))(response);
        if (result && typeof result[Symbol.iterator] === 'function') {
            try {
                this.handle_spider_output(result, response);
            } catch (e) {
                logger.error(e.stack);
            }
        }
    }

    handle_spider_output(result: any, response: Response) {
        for (let item of result) {
            if (item === null) {
                continue;
            } else if (item.constructor === Request) {
                this.crawl(item);
            } else if (item.constructor == Object) {
                this.process_item(item, response);
            } else {
                logger.warn('Spider must return Request, dict or null')
            }
        }
    }

    process_item(item: any, response: Response) {
        for (let method of this.methods['process_item']) {

            item = method(item, response, this.spider);
            if (!item) {
                break;
            }
        }
    }

    async download(request: Request) {
        return await this.downloader.fetch(request, this.spider);
    }
}