import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/layout/layout';
import Home from '@/pages/home/home';
import Chat from '@/pages/chat/chat';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="chat">
          <Route index element={<Chat />} />
          <Route path=":sessionId" element={<Chat />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
