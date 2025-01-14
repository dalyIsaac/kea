export interface Crumb {
  text: string;
  href: string;
}

export interface CrumbsState {
  crumbs: Crumb[];
}
