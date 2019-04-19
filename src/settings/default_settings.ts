// 重试请求状态码
export let RETRY_STATUS_CODES = [500, 502, 503, 504, 400, 403, 408, 404]

// 重试次数
export let RETRY_COUNT = 3;

// 请求超时时间
export let TIMEOUT = 10;

// 并发数
export let MAX_REQUEST_SIZE = 50;

// 允许请求重定向
export let ENABLE_REDIRECT = true;

// 重定向状态码
export let REDIRECT_STATUS_CODE = [301, 302];

// 下载器中间件
export let DOWNLOAD_MIDDLEWARE = [
    {
        class: require('../downloadMiddleware/redirect').default,
        priority: 200
    },
    {
        class: require('../downloadMiddleware/retry').default,
        priority: 300
    }
]

export let ITEM_PIPELINES = []

// 下载延迟
export let DOWNLOAD_DELAY = 1;

export let USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';