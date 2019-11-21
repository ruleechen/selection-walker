export interface MatchProps {
  startsNode: Node;
  startsAt: number;
  endsNode: Node;
  endsAt: number;
  context: any;
}

export interface ObserverProps {
  matcher: (node: Node, children: boolean) => MatchProps[];
  onHoverIn?: (target: Element, match: MatchProps) => void;
  onHoverOut?: (target: Element) => void;
  attributeFilter?: string[];
}
