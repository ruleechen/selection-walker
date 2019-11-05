export interface IMatch {
  startsNode: Node;
  startsAt: number;
  endsNode: Node;
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
