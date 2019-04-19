import * as fs from 'fs';

import { Spider, Request, Response, ItemPipeline, Item } from '../index'

class FileItemPipeline extends ItemPipeline {
    process_item(item: Item, response: Response, spider: Spider): void | Item {
        console.log(item);
        return item;
    }
}

class HupuSpider extends Spider {
    name = 'hupu';

    settings = {
        'ITEM_PIPELINES': [{
            class: FileItemPipeline,
            priority: 200
        }]
    };

    * start_request() {
        let url = 'https://bbs.hupu.com/bxj'
        yield new Request({
            url: url,
            callback: this.parse
        });
    }

    * parse(response: Response) {
        let $ = response.selector;
        let posts: any[] = [];
        $('a.truetit').each(function (i: number, item: any) {
            let title = $(item).text();
            let url = response.urljoin($(item).attr('href'));
            posts.push({
                title,
                url
            });
        });

        for (let post of posts.slice(0, 4)) {
            yield new Request({
                url: post['url'],
                callback: this.detail,
                meta: {
                    test: 1
                }
            });
        }
    }

    * detail(response: Response) {
        let $ = response.selector;
        let info = {
            title: $('#j_data').text(),
            author: $('#tpc .author .u').text(),
            url: response.url,
            test: response.meta['test']
        }
        yield info;
    }
}

let spider = new HupuSpider();
spider.start();