import { useEffect, useState } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState('');
  const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null);
  const [isModelCached, setIsModelCached] = useState<boolean | null>(null);

  // Check if model is cached on component mount
  useEffect(() => {
    const checkCache = async () => {
      try {
        const cached = await webllm.hasModelInCache(MODEL_ID);
        setIsModelCached(cached);
      } catch {
        setIsModelCached(false);
      }
    };
    checkCache();
  }, []);

  const initializeEngine = async () => {
    if (engine) return;

    setIsInitializing(true);
    setInitProgress(isModelCached ? 'Loading model from cache...' : 'Downloading model...');

    try {
      const newEngine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (progress) => {
          setInitProgress(progress.text);
        },
      });
      setEngine(newEngine);
      setIsModelCached(true);
      setInitProgress('Model loaded successfully!');
      setTimeout(() => setIsInitializing(false), 1000);
    } catch (error) {
      console.error('Failed to initialize engine:', error);
      setInitProgress('Failed to load model. Please refresh and try again.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!engine) {
      await initializeEngine();
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await engine.chat.completions.create({
        messages: [...messages, userMessage],
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: reply.choices[0].message.content || '',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="container flex h-full max-w-4xl flex-col py-4">
        {/* Welcome Screen */}
        {!engine && !isInitializing && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to OpenManus Chat</h2>
            <p className="text-muted-foreground">
              Click the button below to load the AI model and start chatting.
            </p>
            <Button onClick={initializeEngine} size="lg">
              {isModelCached ? 'Load AI Model (Cached)' : 'Load AI Model'}
            </Button>
            <p className="text-sm text-muted-foreground italic">
              {isModelCached
                ? 'Model is cached locally. Loading will be fast.'
                : 'Note: The model (~400MB) will be downloaded and cached in your browser on first load.'}
            </p>
          </div>
        )}

        {/* Loading Screen */}
        {isInitializing && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <Loader variant="circular" size="lg" />
            <Loader variant="loading-dots" text={initProgress} size="md" />
          </div>
        )}

        {/* Chat Interface */}
        {engine && !isInitializing && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-muted/30 p-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Start a conversation with the AI!
                </div>
              )}

              {/* Message List */}
              {messages.map((message, index) => (
                <Message
                  key={index}
                  className={cn(message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  <MessageAvatar
                    src={message.role === 'user' ? '/user-avatar.png' : '/bot-avatar.png'}
                    alt={message.role === 'user' ? 'User' : 'AI'}
                    fallback={message.role === 'user' ? 'U' : 'AI'}
                  />
                  <MessageContent
                    markdown={message.role === 'assistant'}
                    className={cn(
                      'max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary',
                    )}
                  >
                    {message.content}
                  </MessageContent>
                </Message>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <Message>
                  <MessageAvatar src="/bot-avatar.png" alt="AI" fallback="AI" />
                  <MessageContent className="bg-secondary">
                    <Loader variant="typing" size="md" />
                    {null}
                  </MessageContent>
                </Message>
              )}
            </div>

            {/* Input Area */}
            <PromptInput
              value={input}
              onValueChange={setInput}
              onSubmit={handleSend}
              disabled={isLoading}
              className="mt-4"
            >
              <PromptInputTextarea placeholder="Type your message here..." />
              <PromptInputActions className="justify-end px-2 pb-2">
                <PromptInputAction tooltip="Send message">
                  <Button
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    onClick={handleSend}
                    className="h-9 w-9 rounded-full"
                  >
                    {isLoading ? (
                      <Loader variant="circular" size="sm" className="border-primary-foreground" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
