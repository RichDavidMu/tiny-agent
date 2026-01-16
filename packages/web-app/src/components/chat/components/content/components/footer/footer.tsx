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
import rootStore from '@/stores/rootStore.ts';
// import llm from '@/agentCore/llm.ts';

const Footer = observer(() => {
  const { inputStore } = rootStore;
  return (
    <PromptInput
      value={inputStore.input}
      onValueChange={(value) => inputStore.setInput(value)}
      onSubmit={() => inputStore.handleSend()}
      disabled={inputStore.loading}
      className="mt-4"
    >
      <PromptInputTextarea placeholder="Type your message here..." />
      <PromptInputActions className="justify-end px-2 pb-2">
        <PromptInputAction
          tooltip={'send message'}
          // tooltip={llm.ready ? 'Send Message' : `Loading Model: \n${llm.progressText}`}
          className="max-w-sm"
        >
          <Button
            size="icon"
            // disabled={!inputStore.input.trim() || inputStore.loading || !llm.ready}
            onClick={() => inputStore.handleSend()}
            className="h-9 w-9 rounded-full"
          >
            {inputStore.loading ? (
              <Loader variant="circular" size="sm" className="border-primary-foreground" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
});

export default Footer;
