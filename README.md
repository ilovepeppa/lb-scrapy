# lb-scrapy


A simple and lightweight scrapy for node.js.

# Install

#### NPM

```bash
npm install lb-scrapy
```

# Our first Spider

```js
const fs = require('fs');

const {
    Request,
    Spider
} = require("lb-scrapy");

class QuoteSpider extends Spider {
    * start_request() {
        let urls = [
            'http://quotes.toscrape.com/page/1/',
            'http://quotes.toscrape.com/page/2/',
        ];
        for (let url of urls) {
            yield new Request({
                url: url,
                callback: this.parse
            })
        }
    }

    parse(response) {
        let page = response.url.match(/\d+/)[0];
        let filename = `quotes-${page}.html`;
        fs.writeFile(filename, response.text, function (err) {
            if (err) {
                console.log(err);
            }
        })
        console.log(`Saved file ${filename}`)
    }
}

let spider = new QuoteSpider();
spider.start();
```

## A shortcut to the start_requests method


Instead of implementing a `start_requests` method that generate `Request` objects from URLs, you can just define a `start_urls` class attribute with a list of URLs. This list will then be used by the default implementation of `start_requests()` to create the initial requests for your spider. 

```js
const fs = require('fs');

const {
    Request,
    Spider
} = require("lb-scrapy");

class QuoteSpider extends Spider {
    constructor() {
        super(...arguments);
        this.start_urls = [
            'http://quotes.toscrape.com/page/1/',
            'http://quotes.toscrape.com/page/2/',
        ]
    }

    parse(response) {
        let page = response.url.match(/\d+/)[0];
        let filename = `quotes-${page}.html`;
        fs.writeFile(filename, response.text, function (err) {
            if (err) {
                console.log(err);
            }
        })
        console.log(`Saved file ${filename}`)
    }
}

let spider = new QuoteSpider();
spider.start();
```

# Item Pipeline

After an item has been scraped by a spider, it is sent to the Item Pipeline which processes it through serveral components that are executed sequentially.

Each item pipeline component is a Javascript class that implements a simple method. They receive an item and perform an action over it, also deciding if the item should continue through the pipeline or be dropped and no longer processed.

## Writing your own item pipeline

Each item pipeline component is a Javascript class that must implement the following method:

### `process_item(item, response, spider)`

The method is called for every item pipeline component. `process_item()` must return a dict with data. Dropped items are no logger processed by further pipeline components.

#### Parameters
+ `item` : the item scraped
+ `response`: the response which generated the item
+ `spider`: the spider which scraped the item

### Item Pipeline Example

The following pipeline stores all scraped items into a single `result.txt` file, containing one item per line serialized in JSON format:

```js
const {ItemPipeline} = require('lb-scrapy');

class FileItemPipeline extends ItemPipeline {
    constructor() {
        super(...arguments);
        fs.writeFileSync('result.txt', '');
    }

    process_item(item, response, spider) {
        fs.appendFileSync('result.txt', JSON.stringify(item) + '\r\n');
        return item;
    }
}
```