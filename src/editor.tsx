import ReactDOM from "react-dom";
import {
  MDXEditor,
  MDXEditorMethods,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  headingsPlugin,
  InsertImage,
  InsertTable,
  linkPlugin,
  linkDialogPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  ListsToggle,
  InsertThematicBreak,
  // UndoRedo,

} from '@mdxeditor/editor';

import '@mdxeditor/editor/style.css';
import './dark-theme.css';
import { useEffect, useRef, useState } from "react";
import { debounce } from "./utils";

// @ts-expect-error VSCode global
const vscode = acquireVsCodeApi();

function Editor({vscode}: {vscode: any}) {
    const editorText = vscode.getState()?.markdown || "X";
    const mdxRef = useRef<MDXEditorMethods>(null);

    const handleChange = debounce((markdown: string) => {
      vscode.setState({ markdown });
      vscode.postMessage({
          type: "add",
          text: markdown,
      });
    }, 200);

    useEffect(() => {
      mdxRef.current?.setMarkdown(editorText);

      function onReceiveMessage(event: MessageEvent) {
        const message = event.data;
        const current = vscode.getState()?.markdown;
        const { type, text } = message;

        vscode.postMessage({
          type: "log",
          text: JSON.stringify({prev: text.trim(), current: current.trim() }),
      });

        switch (type) {
          case "update":
              // if(current.trim() !== text.trim()) {
                mdxRef.current?.setMarkdown(text);
                vscode.setState({ markdown: text });
              // }
            return;
        }
      }

      // Handle messages sent from the extension to the webview
      window.addEventListener("message", onReceiveMessage);
      return () => window.removeEventListener("message", onReceiveMessage);
    }, []);


    return (<div style={{marginTop: '15px'}}>
      <MDXEditor
        ref={mdxRef}
        className="dark-theme dark-editor"
        markdown=''
        onChange={handleChange}
        plugins={[
          headingsPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          listsPlugin(),
          quotePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <BlockTypeSelect/>
                <Sep/>
                <BoldItalicUnderlineToggles />
                <Sep/>
                <ListsToggle/>
                <CodeToggle/>
                <CreateLink/>
                <InsertThematicBreak/>
                {/* <InsertImage/> */}
                <Sep/>
                <InsertTable />
              </>
            )
          })
        ]}
      />
    </div>);
}

function Sep(){
  return <span style={{fontSize: '1.5em', padding: '0 0.5em 0.1em 0.5em', opacity: 0.5}}>{'⁝'}</span>;
};

ReactDOM.render(<Editor vscode={vscode} />, document.getElementById("app"));
