declare namespace novelupdates {
  interface StorageEntry {
    url: string;
    time: number;
    wayback: boolean;
    page: string;
  }

  interface Parent {
    url: string;
    id?: number;
    index?: number;
  }

  interface UrlObj {
    url: string;
  }

  interface HalfReqData {
    parent: Parent;
    tabId: number;
  }

  type ReqData = StorageEntry & HalfReqData
  type Req = MyRequest<ReqData>

  interface Novels {
    [key: string]: StorageEntry[];
  }

  interface PageOpenOpts {
    url: string;
    wayback: boolean;
    save: boolean;
  }
}
