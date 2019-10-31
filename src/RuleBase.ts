import { ISelectionBlock } from './interfaces';

class RuleBase {
  init(container: HTMLElement): ISelectionBlock[] {
    console.log(container);
    return null;
  }

  apply(mutations: MutationRecord[]): ISelectionBlock[] {
    console.log(mutations);
    return null;
  }
}

export default RuleBase;
