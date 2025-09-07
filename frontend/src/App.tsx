import React from 'react'
import CreateRoom from './components/CreateRoom'
import Chat from './components/Chat'

const App = () => {
  return (
    <div className='min-h-screen flex justify-center items-center bg-neutral-950 text-white'>
      {/* <CreateRoom /> */}
      <Chat />
    </div>
  )
}

export default App