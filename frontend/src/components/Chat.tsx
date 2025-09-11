import { useEffect, useRef, useState } from 'react';
import Header from './Header'
import { useWebSocket } from './WebSocketContext';

type Message = {
  text: string,
  sender: "me" | "them"
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { socket } = useWebSocket()
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const newMessage = event.data;
        console.log("Received:", newMessage)
        setMessages(prevMessages => [...prevMessages, newMessage])
      }
    }
  })

  const handleClick = () => {
    const message = inputRef.current?.value;
    if (!message) return;
    setMessages(prevMessage => [...prevMessage, { text: message, sender: "me" }]);
    if (socket) {
      socket.send(JSON.stringify({
        type: 'chat',
        payload: {
          message,
          roomId: localStorage.getItem("roomID")
        }
      }));
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }
  return (
    <div className='flex flex-col gap-y-4 border border-neutral-800 p-4 rounded-lg'>
      <Header />
      <div className='bg-neutral-800 p-2 rounded-lg flex justify-between'>
        <div>Room Code: 808080</div>
        <div>Users 2/2</div>
      </div>
      <div className='border border-neutral-800 rounded-lg w-full p-4 h-80 flex flex-col overflow-auto [&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-thumb]:bg-slate-500/40
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb:hover]:bg-slate-500'>{messages.map((message, index: number) => <div className={`p-2 mt-2 rounded-lg inset-0 w-fit max-w-80 break-words ${message.sender === 'me' ? 'bg-white text-black self-end' : 'bg-neutral-800 text-white self-start'}`} key={index}>{message.text}</div>)}</div>
      <div className='flex gap-x-2'>
        <input ref={inputRef} id='message' type="text" placeholder='Type a message' className=' border-neutral-800 p-3 rounded-lg focus:border-white border-2 focus:border-2 w-[80%]' />
        <button onClick={handleClick} className='bg-white text-black font-semibold p-3 rounded-lg px-6 tracking-wider'>Send</button>
      </div>
    </div>
  )
}

export default Chat