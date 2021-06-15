interface MyRequest<T> {
  requestType: string;
  data: T;
  extensionName: string;
}

interface UserScriptData {
  url: string;
  extension: string;
  message: string;
}

interface UserScriptReq {
  data: UserScriptData;
}

interface UserScriptHandlerObj {
  [key: string]: [any, () => void];
}

type Fn1<T> = (x: T) => T;
type FnN<T> = (...x: T[]) => T;

declare module "extension-kitchen-sink/import-export-storage";

interface WaybackResponse {
  data: {
    // eslint-disable-next-line camelcase
    archived_snapshots: {
      closest: {
        url: string;
      };
    };
  };
}
