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

We use [cheerio](https://github.com/cheeriojs/cheerio) to parse HTML in response, you can use it with `response.selector`.

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
const fs = require('fs');
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
const fs = require('fs');
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

# Spider

Spiders are classes which define how a certain site will be scraped, including how to perform the crawl and how to extract structured data from thee pages. In other words, Spiders are the place where you define the custom behaviour for crawling and parsing pages for a particular site.

## `class lb-scrapy.Spider`

This is the simplest spider, and the one from which every other spider must inherit. It doesn’t provide any special functionality. It just provides a default `start_requests()` implementation which sends requests from the `start_urls` spider attribute and calls the spider’s method 

### `start_urls`

A list of URLs where the spider will begin to crawl from, when no particular URLs are specified. So, the first pages downloaded will be those listed here. The subsequent `Request` will be generated successively from data contained in the start URLs.

### `settings`

A dictionary of settings that will be overridden from the global configuration when running this spider. It must be defined as a class attribute since the settings are updated before instantiation.

### `start_requests()`

This method must return an iterable with the first Requests to crawl for this spider. It is called by Scrapy when the spider is opened for scraping. Scrapy calls it only once, so it is safe to implement `start_requests()` as a generator.

The default implemetation generates `Request({url})` for each url in `start_urls`.

If you want to change the Requests used to start scraping a domain, this is the method to override. For example, if you need to start by logging in using a POST request, you could do:

```js
const {
    Request,
    Spider
} = require("lb-scrapy");

class MySpider extends Spider {
    * start_request() {
        yield new Request({
            url: 'http://httpbin.org/post',
            method: 'POST',
            data: {
                'user': 'john',
                'pass': 'secret'
            },
            callback: this.logged_in
        });
    }

    logged_in(response) {
        //  here you would extract links to follow and return Requests
        //  for each of them, with another callback
    }
}

let spider = new MySpider();
spider.start();
```

### `parse(response)`

This is the default callback used by Scrapy to process downloaded responses, when their requests don’t specify a callback.

The `parse` method is in charge of processing the response and returning scraped data and/or more URLs to follow. Other Requests callbacks have the same requirements as the `Spider` class.

This method, as well as any other Request callback, must return an iterable of `Request` and/or dicts.

#### Parameters
+ `response` : the response to parse

### `start()`

Call this method to start the spider.

# Request and Respons

Scrapy uses `Request` and `Response` objects for crawling web sites.

Typically, `Request` objects are generated in the spiders and pass across the system until they reach the Downloader, which executes the request and returns a `Response` object which travels back to the spider that issued the request.


## `class lb-scrapy.Request(options)`

A `Request` object represents an HTTP request, which is usually generated in the Spider and executed by the Downloader, and thus generating a `Response`.

### `options`

+ `url(string)`: the URL of the request
+ `callback(function)`: the function that will be called with the response of the request as its first parameter. If a Request doesn't specify a callback, the spider's `parse()` method will be used.
+ `method(string)`: the HTTP method of the request. Defaults to `'GET'`.
+ `headers(object)`: the headers of the request.
+ `dont_filter(boolean)`: indicates that this request should not be filtered by the scheduler. Defaults to `false`.
+ `data(object)`: body for POST and PUT requests. if given, this adds `Content-type: application/x-www-form-urlencoded` header. Defaults to `null`.
+ `json(object)`: JSON representation of body. if given, this adds `Content-type: application/json` header. Defaults to `null`.
+ `cookies(object)`: the request cookie. For example：
    ```js
    let request = new Request({
        url: 'http://httpbin.org/cookies',
        cookies: {
            cookies_are: 'working'
        }
    })
    ```
+ `meta(object)`: an object that contains arbitrary metadata for this request. It can alse be accessed from the `response.meta` attribute. 

## `class lb-scrapy.Response`

A `Response` object represents an HTTP response, which is usually downloaded (by the Downloader) and fed to the Spiders for processing.

### `url`
The URL of the response.

### `status`
The HTTP status of the response.

### `headers`
The headers of the response.

### `text`
The response body.

### `cookies`
The cookies contained in the response.

### `meta`
An object that passed from the request.

### `selector`
The `cheerio` instance which loads the response body.

### `urljoin(url)`
Constructs an absolute url by combining the Response’s url with a possible relative url.


## License

MIT
