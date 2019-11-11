export interface IMatch {
  startsNode: Node;
  startsAt: number;
  endsNode: Node;
  endsAt: number;
  context: any;
}

export interface IMatcher {
  (node: Node): IMatch[];
}

export interface IListener {
  (match: IMatch): void;
}

export interface IObserverProps {
  matcher: IMatcher;
  hover: IListener;
}

export interface IWidgetProps {
  root: HTMLElement;
}
