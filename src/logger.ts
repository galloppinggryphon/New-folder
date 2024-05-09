import * as vscode from 'vscode';

let mdxLog: vscode.OutputChannel;


export default function log(...msg: any[]) {
    if (!mdxLog) {
        mdxLog = vscode.window.createOutputChannel("MDXEditor");
    }

    msg.forEach((m, i) => {
        const _msg = Object(msg) === msg ? JSON.stringify(m) : m;

        if (i === 0) {
            mdxLog.appendLine('');
            // mdxLog.append(i + ': ' + _msg);
        }
        // else {
            mdxLog.append(" " + _msg);
        // }
    });
};
