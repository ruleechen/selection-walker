export interface ISelectionBlock {
  startsNode: HTMLElement;
  startsAt: number;
  endsNode: HTMLElement;
  endsAt: number;
  number: any;
}

export interface ISelectionRule {
  init(container: HTMLElement): ISelectionBlock[];
  apply(mutations: MutationRecord[]): ISelectionBlock[];
}

export interface IWidgetRender {
  render(root: HTMLElement): any;
}
