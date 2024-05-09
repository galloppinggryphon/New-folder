export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// export function debounce2(func: (...args: any) => any, timeout = 300) {
//   let timer: NodeJS.Timeout | undefined;
//   return (...args: any) => {
//     clearTimeout(timer);
//     timer = setTimeout(() => {
//       timer = undefined;
//       func.apply(this, args);
//     }, timeout);
//   };
// }


export function debounce<Callback extends (...args: any[]) => any>(callback: Callback, timeoutInMs: number) {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<Callback>): Promise<ReturnType<Callback>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(callback(...args)), timeoutInMs);
    });
}

export function windowsToUnixEol(text: string) {
  const win = /(\r\n)/g;
  return text.replace(win, '\n');
}
