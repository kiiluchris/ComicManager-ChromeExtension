import { Moment } from "moment";

declare namespace webtoons {
  interface StorageEntry {
    title: string;
    link: string;
  }
  
  interface OverlayData {
    titleOrder: StorageEntry[];
    offset: number;
  }
  
  interface NextChapterData {
    numOfChapters: number;
  }
  type DateF = string | Date | Moment

  type StorageEntryFromClient = webtoons.StorageEntry & {
    hasOpenedChapter: boolean;
  }
}
