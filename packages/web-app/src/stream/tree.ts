import { makeAutoObservable } from 'mobx';
import { type HistoryResponse } from 'agent-core';
import { Node, TaskNode, TextNode, ThinkNode } from '@/stream/node';

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

  generateFromSession(history: HistoryResponse) {
    history.nodes.forEach((node) => {
      const newNode = new Node({ id: node.id, role: node.role });
      node.content.forEach((c) => {
        if (c.type === 'text') {
          newNode.content.push(new TextNode(c));
        }
        if (c.type === 'thinking') {
          newNode.content.push(new ThinkNode(c));
        }
        if (c.type === 'task') {
          newNode.content.push(new TaskNode(c));
        }
      });
      this.appendNode(newNode);
    });
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
