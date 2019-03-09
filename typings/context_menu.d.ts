declare module context_menus {
  interface Callbacks {
    [key: string]: (...args: any) => void
  }
}