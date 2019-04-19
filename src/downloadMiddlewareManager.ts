import DownloadMiddleware from './downloadMiddleware';
import Spider from './spider';
import Request from './request';
import Response from './response';
import Settings from './settings/settings';


export default class DownloadMiddlewareManager {

    methods: { [key: string]: any[] } = {
        'process_request': [],
        'process_response': [],
    };

    constructor() {
        let middlewares = Settings.getInstance().get('DOWNLOAD_MIDDLEWARE');
        middlewares.sort((x: { [key: string]: any }, y: { [key: string]: any }) =>
            (y['priority'] as number) - (x['priority'] as number));
        for (let middleware of middlewares) {
            this.add_middleware(new middleware.class());
        }
    }

    private add_middleware(middleware: DownloadMiddleware) {
        if (typeof middleware['process_request'] === 'function') {
            this.methods['process_request'].push(middleware['process_request'].bind(middleware));
        }
        if (typeof middleware['process_response'] === 'function') {
            this.methods['process_response'].unshift(middleware['process_response'].bind(middleware));
        }
    }

    async download(download: any, request: Request, spider: Spider) {
        const $this = this;
        function process_request(request: Request, spider: Spider) {
            for (let method of $this.methods['process_request']) {
                method(request, spider);
            }
        }

        function process_response(request: Request, response: Response) {
            for (let method of $this.methods['process_response']) {
                response = method(request, response);
                if (response && response.constructor !== Response) {
                    return response;
                }
            }
            return response;
        }

        let response;
        try {
            process_request(request, spider);
            response = await download(request);
            response = process_response(request, response);
        } catch (e) {
            console.log();
            response = null;
        }

        return response;
    }
};