import * as rq from 'request-promise';
import * as tough from 'tough-cookie';
import Request from './request';
import Response from './response';
import Spider from './spider';
import Settings from './settings/settings';
import DownloadMiddlewareManager from './downloadMiddlewareManager';


class DownloadHandler {
    async fetch(request: Request) {
        let default_headers = {
            'user-agent': Settings.getInstance().get('USER_AGENT')
        };

        let options: { [key: string]: any } = {
            uri: request.url,
            resolveWithFullResponse: true,
            simple: false,
            method: request.method,
            followRedirect: false,
            headers: { ...default_headers, ...request.headers }
        };

        if (request.method.toLowerCase() === 'post') {
            if (request.data) {
                options['form'] = request.data;
            } else if (request.json) {
                options['body'] = request.json;
                options['json'] = true;
            } else {
                options['form'] = {};
            }
        }

        if (request.cookies) {
            const cookiejar = rq.jar();
            for (let key in request.cookies) {
                const c = new tough.Cookie({
                    key: key,
                    value: request.cookies[key]
                });

                cookiejar.setCookie(c, request.url);
            }
            options['jar'] = cookiejar;
        }

        let response = Response.from_response(await rq(options as rq.Options));

        if (response) {
            response.meta = { ...response.meta, ...request.meta };
        }

        return response;
    }
}


export default class Downloader {
    private downloadHandler: DownloadHandler = new DownloadHandler();
    private downloadMiddlewareManager: DownloadMiddlewareManager = new DownloadMiddlewareManager();

    private download(request: Request) {
        return this.downloadHandler.fetch(request);
    }

    fetch(request: Request, spider: Spider) {
        return this.downloadMiddlewareManager.download(this.download.bind(this), request, spider);
    }
}