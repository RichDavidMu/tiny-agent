import type { ROLE_TYPE } from 'agent-core';
import { makeAutoObservable, observable } from 'mobx';
import type { ContentNode } from '@/stream/node/contentNodes';

export class Node {
  role: ROLE_TYPE;
  id: string;
  parent: Node | null = null;
  children: Node | null = null;
  content = observable.array<ContentNode>([]);
  constructor({ id, role }: { id: string; role: ROLE_TYPE }) {
    makeAutoObservable(this);
    this.id = id;
    this.role = role;
  }

  get contentTail(): null | ContentNode {
    return this.content[this.content.length - 1] || null;
  }
  get isEmpty() {
    return this.content.length === 0;
  }
}
