export interface IMatch {
  startsNode: Node;
  startsAt: number;
  endsNode: Node;
  endsAt: number;
  number: any;
}

export interface IMatcher {
  (node: Node): IMatch[];
}

export interface IListener {
  (match: IMatch): void;
}

export interface IWalkerProps {
  root: Node;
  matcher: IMatcher;
  hover: IListener;
}
