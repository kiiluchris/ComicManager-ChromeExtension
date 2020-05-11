declare namespace context_menus {
  interface Callbacks {
    [key: string]: (...args: any) => void;
  }
}