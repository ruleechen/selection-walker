export interface MatchProps {
  startsNode: Node;
  startsAt: number;
  endsNode: Node;
  endsAt: number;
  context: any;
}

export interface IMatchObject extends MatchProps {
  readonly rect: ClientRect;
  readonly context: any;
}

export interface ObserverProps {
  matcher: (node: Node, children: boolean) => MatchProps[];
  onHoverIn?: (target: Element, match: IMatchObject) => void;
  onHoverOut?: (target: Element) => void;
  observerOptions?: MutationObserverInit;
}
