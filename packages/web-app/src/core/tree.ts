import { makeAutoObservable } from 'mobx';
import { TaskNode } from '@/core/node/taskNode.ts';

class Tree {
  root = Tree.createRoot();
  currentNode = this.root;

  constructor() {
    makeAutoObservable(this);
  }

  get list() {
    const list: TaskNode[] = [];
    let tail: TaskNode | null = this.currentNode;
    while (tail && tail.id !== '0') {
      list.unshift(tail);
      tail = tail.parent;
    }
    return list;
  }

  appendNode(node: TaskNode) {
    this.currentNode.children = node;
    node.parent = this.currentNode;
    this.currentNode = node;
  }

  static createRoot() {
    return new TaskNode({ id: '0', role: 'assistant' });
  }

  reset() {
    this.root = Tree.createRoot();
    this.currentNode = this.root;
  }
}

export default new Tree();
