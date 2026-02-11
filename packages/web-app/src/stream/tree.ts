import { makeAutoObservable } from 'mobx';
import { Node } from '@/stream/node/node.ts';

class Tree {
  root = Tree.createRoot();
  currentNode = this.root;

  constructor() {
    makeAutoObservable(this);
  }

  get list() {
    const list: Node[] = [];
    let tail: Node | null = this.currentNode;
    while (tail && tail.id !== '0') {
      list.unshift(tail);
      tail = tail.parent;
    }
    return list;
  }

  appendNode(node: Node) {
    this.currentNode.children = node;
    node.parent = this.currentNode;
    this.currentNode = node;
  }

  static createRoot() {
    return new Node({ id: '0', role: 'assistant' });
  }

  reset() {
    this.root = Tree.createRoot();
    this.currentNode = this.root;
  }
}

const tree = new Tree();
export default tree;
