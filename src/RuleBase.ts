import SelectionBlock from './SelectionBlock';

class RuleBase {
  init(container: Node): SelectionBlock[] {
    console.log(container);
    return null;
  }

  apply(mutations: MutationRecord[]): SelectionBlock[] {
    console.log(mutations);
    return null;
  }
}

export default RuleBase;
