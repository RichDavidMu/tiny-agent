import type { CreateFileInput, HistoryTextContent, TextContentBlock } from '@tini-agent/agent-core';
import { action, makeObservable, observable } from 'mobx';
import { BaseContentNode } from '@/stream/node/content-nodes/base.ts';

export class TextNode extends BaseContentNode {
  type = 'text' as const;
  text = '';
  attachments = observable.array<CreateFileInput>([]);
  constructor(initParams?: HistoryTextContent) {
    super();
    makeObservable(this, {
      text: observable,
      update: action,
      attachments: observable,
    });
    if (!initParams) return;
    const { text, attachments } = initParams;
    this.text = text;
    if (attachments) {
      this.attachments.replace(attachments);
    }
  }
  update(chunk: TextContentBlock) {
    const { text, attachments } = chunk.content_block;
    this.text += text;
    if (attachments) {
      this.attachments.replace(attachments);
    }
  }
}
