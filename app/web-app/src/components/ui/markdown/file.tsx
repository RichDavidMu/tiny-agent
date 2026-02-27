import type { CreateFileInput } from '@tini-agent/agent-core';

export function FileComponent({
  ids,
  attachment,
}: {
  ids: string[];
  attachment?: CreateFileInput[];
}) {
  if (!attachment) {
    return null;
  }
  const files = attachment.filter((a) => {
    return ids.includes(a.id);
  });
  return (
    <span>
      {files.map((file) => (
        <span key={file.id}></span>
      ))}
    </span>
  );
}
