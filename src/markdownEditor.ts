import * as vscode from "vscode";

// import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE } from "./constants";

import { getNonce } from "./utils";
import log from "./logger";


/**
 * Provider for rich markdown editor.
 */
export default class MarkdownEditor implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new MarkdownEditor(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      MarkdownEditor.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = "mdxEditor.markdownEditor";

  constructor(
		private readonly context: vscode.ExtensionContext
	) { }

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
      });
    }

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (
          e.contentChanges.length &&
          e.document.uri.toString() === document.uri.toString()
        ) {

          if(e.contentChanges[0].text !== document.getText()) {
            log('onDidChangeTextDocument', e.contentChanges);
            log('document ==>', document.getText());
            updateWebview();
          }
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      log('onDidDispose');
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {

      switch (e.type) {
        case "add":
          log('onDidReceiveMessage', e);
          return this.updateTextDocument(document, e.text);
        case "openLink":
          vscode.env.openExternal(vscode.Uri.parse(e.text));
          return true;
        case "log":
          log("\nCLIENT LOG --> ", JSON.parse(e.text));
      }
    });

    updateWebview();
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // const fontSize = vscode.workspace
    //   .getConfiguration("rich-markdown-editor")
    //   .get("fontSize", DEFAULT_FONT_SIZE)

    // const fontFamily = vscode.workspace
    //   .getConfiguration("rich-markdown-editor")
    //   .get("fontSize", DEFAULT_FONT_FAMILY)

    const fontFamily = 'Arial';
    const fontSize = '16px';

    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out", "editor.js")
    );

    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'out', 'editor.css'));

    const themeUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this.context.extensionUri, 'out', 'theme.css'));

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Markdown Editor</title>
        <style>
          :root {
            --rich-markdown-editor-font-family: ${fontFamily};
          }
          body {
            margin: 0;
            padding: 0;
            font-size: ${fontSize};
          }
        </style>
        <link href="${styleUri}" rel="stylesheet" />
        <link href="${themeUri}" rel="stylesheet" />
			</head>
			<body>
        <div id="app">Loading Markdown Editor...</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  /**
   * Write out the text to a given document.
   */
  private updateTextDocument(document: vscode.TextDocument, text: string) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      text
    );

    return vscode.workspace.applyEdit(edit);
  }
}
