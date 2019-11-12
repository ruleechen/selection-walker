export interface IMatch {
  startsNode: Node;
  startsAt: number;
  endsNode: Node;
  endsAt: number;
  context: any;
}

export interface IMatcher {
  (node: Node, children: boolean): IMatch[];
}

export interface IListener {
  (match: IMatch): void;
}

export interface IObserverProps {
  matcher: IMatcher;
  hover: IListener;
  attributeFilter?: string[];
}

export interface IWidgetProps {
  root: HTMLElement;
}
