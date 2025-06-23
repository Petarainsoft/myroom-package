//ansi color 코드 : https://talyian.github.io/ansicolors/
export class Logger {
    private static _instance: Logger;
    private notAppendedMessage: string[] = [];
    public needUpdateLogMessages: boolean = false;

    constructor() {
        Logger._instance = this;
    }

    public static log(msg: string, color: string = "\x1b[30m") {
        if (this._instance) {
            this._instance.notAppendedMessage.push(`${color} ${msg}`);
            this._instance.needUpdateLogMessages = true;
        }
    }

    public static warn(msg: string) {
        if (this._instance) {
            this._instance.notAppendedMessage.push(`\x1b[33m ${msg}`);
            this._instance.needUpdateLogMessages = true;
        }
    }

    public static error(msg: string) {
        if (this._instance) {
            this._instance.notAppendedMessage.push(`\x1b[31m ${msg}`);
            this._instance.needUpdateLogMessages = true;
        }
    }

    public static getInstance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }

        return Logger._instance;
    }

    public getNotAppendedMessage(): string[] {
        return this.notAppendedMessage;
    }

    public clearNotAppendedMessage() {
        this.notAppendedMessage = [];
        this.needUpdateLogMessages = false;
    }
}