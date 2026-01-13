import { useEffect, useRef, useState } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState('');
  const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeEngine = async () => {
    if (engine) return;

    setIsInitializing(true);
    setInitProgress('Initializing WebLLM...');

    try {
      const newEngine = await webllm.CreateMLCEngine('Qwen2.5-0.5B-Instruct-q4f16_1-MLC', {
        initProgressCallback: (progress) => {
          setInitProgress(progress.text);
        },
      });
      setEngine(newEngine);
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

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await engine.chat.completions.create({
        messages: [...messages, userMessage],
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: reply.choices[0].message.content || '',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="container flex h-full max-w-4xl flex-col py-4">
        {!engine && !isInitializing && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to OpenManus Chat</h2>
            <p className="text-muted-foreground">
              Click the button below to load the AI model and start chatting.
            </p>
            <button
              onClick={initializeEngine}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Load AI Model
            </button>
            <p className="text-sm text-muted-foreground italic">
              Note: The model (~400MB) will be downloaded and cached in your browser on first load.
            </p>
          </div>
        )}

        {isInitializing && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{initProgress}</p>
          </div>
        )}

        {engine && !isInitializing && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border bg-muted/50 p-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Start a conversation with the AI!
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex w-full',
                    message.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2',
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex w-full justify-start">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 flex items-end space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                className="min-h-[80px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
