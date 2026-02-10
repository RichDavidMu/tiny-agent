import type { ROLE_TYPE } from 'agent-core';
import { makeAutoObservable, observable } from 'mobx';
import type { ContentNode } from '@/core/node/contentNodes';

export class TaskNode {
  role: ROLE_TYPE;
  id: string;
  parent: TaskNode | null = null;
  children: TaskNode | null = null;
  content = observable.array<ContentNode>([]);
  constructor({ id, role }: { id: string; role: ROLE_TYPE }) {
    makeAutoObservable(this);
    this.id = id;
    this.role = role;
  }
}
