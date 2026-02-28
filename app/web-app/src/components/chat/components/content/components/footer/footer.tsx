import { observer } from 'mobx-react-lite';
import { Send } from 'lucide-react';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Loader } from '@/components/ui/loader.tsx';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion.tsx';
import rootStore from '@/stores/root-store.ts';
import stream from '@/stream/stream.ts';

const Footer = observer(() => {
  const { inputStore } = rootStore;

  const promptSuggestions = ['写一篇特朗普2025年关税政策评价', '生成一个包含新年好是三个字的网页'];

  const handleSuggestionClick = (suggestion: string) => {
    inputStore.setInput(suggestion);
  };

  return (
    <div className="space-y-3 mt-4">
      {/* Prompt Suggestions */}
      {!inputStore.input && (
        <div className="flex flex-wrap gap-2">
          {promptSuggestions.map((suggestion, index) => (
            <PromptSuggestion key={index} onClick={() => handleSuggestionClick(suggestion)}>
              {suggestion}
            </PromptSuggestion>
          ))}
        </div>
      )}

      {/* Prompt Input */}
      <PromptInput
        value={inputStore.input}
        onValueChange={(value) => inputStore.setInput(value)}
        onSubmit={() => inputStore.handleSend()}
        disabled={stream.loading}
      >
        <PromptInputTextarea placeholder="Type your prompt here..." />
        <PromptInputActions className="justify-end px-2 pb-2">
          <PromptInputAction
            tooltip={'send message'}
            // tooltip={llm.ready ? 'Send Message' : `Loading Model: \n${llm.progressText}`}
            className="max-w-sm"
          >
            <Button
              size="icon"
              disabled={!inputStore.input.trim() || stream.loading}
              onClick={() => inputStore.handleSend()}
              className="h-9 w-9 rounded-full"
            >
              {stream.loading ? (
                <Loader
                  variant="circular"
                  size="sm"
                  className="border-primary-foreground border-t-transparent"
                />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
});

export default Footer;
