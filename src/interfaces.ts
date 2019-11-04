export interface IMatch {
  startsNode: Element;
  startsAt: number;
  endsNode: Element;
  endsAt: number;
  rect: ClientRect;
  number: any;
}

export interface IMatcher {
  (node: Node): IMatch[];
}

export interface IListener {
  (match: IMatch): void;
}

export interface IWalkerParams {
  container: Node;
  matcher: IMatcher;
  hover: IListener;
}
