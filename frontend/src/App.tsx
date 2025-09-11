import React, { useEffect, useState } from 'react'
import CreateRoom from './components/CreateRoom'
import Chat from './components/Chat'
import { WebSocketProvider } from './components/WebSocketContext'

const App = () => {
  const [view, setView] = useState<'create' | 'chat'>('create')  
  return (
    <div className='min-h-screen flex justify-center items-center bg-neutral-950 text-white'>
     <WebSocketProvider>
        <div>
          {view === 'chat'? <Chat /> : <CreateRoom onRoomCreated={() => setView('chat')} />}
        </div>
     </WebSocketProvider>
    </div>
  )
}

export default App