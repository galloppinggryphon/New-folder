import { OutputChannel } from "vscode";

let vscode: any;
let mdxLog: OutputChannel;

export default function createLog(vsCode: any) {
    vscode = vsCode;
    return log;
}

function log(...msg: any[]) {
    if (!mdxLog) {
        mdxLog = vscode.window.createOutputChannel("MDXEditor");
    }

    msg.forEach((m, i) => {
        const _msg = Object(msg) === msg ? JSON.stringify(m) : m;
        if (i === 0) {
        mdxLog.appendLine(_msg);
        }
        else {
        mdxLog.append(_msg);
        }
    });
};
