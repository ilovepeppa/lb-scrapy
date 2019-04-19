import * as default_settings from './default_settings';

export default class Settings {
    private static instance: Settings;
    private attrs: { [key: string]: any };
    private constructor() {
        this.attrs = {};
        this.load_default_config();
    }

    static getInstance() {
        if (!Settings.instance) {
            Settings.instance = new Settings();
        }
        return Settings.instance;
    }

    private load_default_config(): void {
        for (let [key, val] of Object.entries(default_settings)) {
            this.set(key, val);
        }
    }

    load_settings(settings: { [key: string]: any }) {
        for (let key in settings) {
            if (!this.attrs.hasOwnProperty(key)) {
                continue;
            }

            let default_val = this.attrs[key];
            let custom_val = settings[key];

            if (default_val.constructor !== custom_val.constructor) {
                continue;
            }

            this.attrs[key] = default_val.constructor === Array ? [...default_val, ...custom_val] : custom_val;
        }
    }

    set(key: string, val: any) {
        this.attrs[key] = val;
    }

    get(key: string, default_val: any = null): any {
        return this.attrs.hasOwnProperty(key) ? this.attrs[key] : default_val;
    }

}