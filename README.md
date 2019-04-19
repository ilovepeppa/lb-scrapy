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
        fs.writeFileSync(filename, response.text);
        console.log(`Saved file ${filename}`);
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
        fs.writeFileSync(filename, response.text);
        console.log(`Saved file ${filename}`);
    }
}

let spider = new QuoteSpider();
spider.start();
```

## Extracting data in our spider

A scrapy spider typically generates many dictionaries containing the data extracted from the page. To do that, we use the `yield` keyword in the callback, as you see below:

```js
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

    * parse(response) {
        let $ = response.selector;
        let items = $('div.quote').map((i, el) => {
            return {
                'text': $(el).find('.text').text(),
                'author': $(el).find('.author').text(),
                'tags': $(el).find('.tags .tag').map((i, el) => $(el).text()).get()
            };
        }).get();

        for (let item of items) {
            yield item;
        }
    }
}

let spider = new QuoteSpider();
spider.start();
```

If you run this spider, it will output the extracted data with the log:

```bash
2019-04-05 19:39:30 [INFO]: Scrapyed from <200 http://quotes.toscrape.com/page/1/>
{"text":"“The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.”","author":"Albert Einstein","tags":["change","deep-thoughts","thinking","world"]}
2019-04-05 19:39:30 [INFO]: Scrapyed from <200 http://quotes.toscrape.com/page/1/>
{"text":"“It is our choices, Harry, that show what we truly are, far more than our abilities.”","author":"J.K. Rowling","tags":["abilities","choices"]}
```

We use [cheerio](https://github.com/ilovepeppa/lb-scrapy) to parse HTML in response, you can use it with `response.selector`.

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

### Activating an Item Pipeline compponent

To active an Item Pipeline component you must add its class to the `ITEM_PIPELINES` setting, like in the following example:

```js
const {
    Request,
    Spider,
    ItemPipeline
} = require("lb-scrapy");

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

class QuoteSpider extends Spider {
    constructor() {
        super(...arguments);
        this.settings = {
            'ITEM_PIPELINES': [{
                class: FileItemPipeline,
                priority: 200
            }]
        };
    }

    ... more code
}

let spider = new QuoteSpider();
spider.start();
```

## License

MIT
