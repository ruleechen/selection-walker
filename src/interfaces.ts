export interface MatchProps {
  startsNode: Node;
  startsAt: number;
  endsNode: Node;
  endsAt: number;
  context: any;
}

export interface ObserverProps {
  matcher: (node: Node, children: boolean) => MatchProps[];
  hover: (match: MatchProps) => void;
  attributeFilter?: string[];
}

export interface WidgetProps {
  root: HTMLElement;
}
