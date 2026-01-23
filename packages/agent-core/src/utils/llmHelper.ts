export function parseLLMReply(text: string): { think: string; content: string } {
  const leadingTrimmed = text.replace(/^\s*/, '');

  // 第一个非空白内容不是 <think>则认为没有思考内容
  if (!leadingTrimmed.startsWith('<think>')) {
    return {
      think: '',
      content: text.trim(),
    };
  }
  const thinkMatch = /<think>([\s\S]*?)<\/think>/.exec(text);

  const think = thinkMatch ? thinkMatch[1].trim() : '';

  const content = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();

  return {
    think,
    content,
  };
}
