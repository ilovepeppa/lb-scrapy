import Response from './response';

export default class Request {

    url: string;
    callback: (response: Response) => void | null;
    method: string;
    dont_filter: boolean;
    headers: any;
    data: any;
    json: any;
    cookies: any;
    meta: { [key: string]: any };

    constructor(option: { [key: string]: any }) {
        let default_option = {
            url: '',
            callback: null,
            method: 'GET',
            headers: {},
            dont_filter: false,
            data: null,
            json: null,
            cookies: null,
            meta: {}
        };
        option = { ...default_option, ...option };
        this.url = option.url;
        this.callback = option.callback;
        this.method = option.method;
        this.headers = option.headers;
        this.dont_filter = option.dont_filter;
        this.data = option.data;
        this.json = option.json;
        this.cookies = option.cookies;
        this.meta = option.meta;
    }
}