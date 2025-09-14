import { useState } from 'react'
import CreateRoom from './components/CreateRoom'
import Chat from './components/Chat'
import { WebSocketProvider } from './components/WebSocketContext'

const App = () => {
  const [view, setView] = useState<'create' | 'chat'>('create')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [userCount, setUserCount] = useState(0);
  const handleRoomCreated = (newRoomId: string, initialCount?: number) => {
    setRoomId(newRoomId)
    setView('chat')
    if(initialCount !== undefined)
      setUserCount(initialCount);
  }

  return (
    <div className='min-h-screen flex justify-center items-center bg-neutral-950 text-white p-4 sm:p-6 lg:p-8'>
      <WebSocketProvider>
        <div className='w-full max-w-md sm:max-w-lg lg:max-w-2xl xl:max-w-4xl'>
          {view === 'chat' ? <Chat roomId={roomId} initialUserCount={userCount} /> : <CreateRoom onRoomCreated={handleRoomCreated} />}
        </div>
      </WebSocketProvider>
    </div>
  )
}

export default App