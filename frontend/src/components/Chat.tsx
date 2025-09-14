import { useEffect, useRef, useState } from 'react';
import Header from './Header'
import { useWebSocket } from './WebSocketContext';

type Message = {
  text: string,
  sender: "me" | "them"
}
type ChatProps = {
  roomId: string | null,
  initialUserCount: number;
}
const Chat = ({ roomId, initialUserCount }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { socket, clientId, lastMessage } = useWebSocket()
  const inputRef = useRef<HTMLInputElement>(null);
  const [userCount, setUserCount] = useState(initialUserCount)

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage) {
      const count = lastMessage.userCount || lastMessage.userCount
      if (count !== undefined) {
        setUserCount(count)
      }
      if (lastMessage.type === 'chatMessage') {
        if (lastMessage.senderId !== clientId)
          setMessages(prevMessages => [...prevMessages, { text: lastMessage.text, sender: "them" }])
      } else if (lastMessage.type === 'joined' || lastMessage.type === 'userLeft') {
        if(lastMessage.senderId !== clientId && lastMessage.senderId)
        setMessages(prevMessage => [...prevMessage, { text: lastMessage.message, sender: "them" }])
      }
    }
    if (lastMessage.payload?.userCount !== undefined) {
      setUserCount(lastMessage.payload.userCount)
    }
  }, [lastMessage, clientId])

  const handleClick = (e?: React.FormEvent) => {
    if(e) e.preventDefault()
    const message = inputRef.current?.value;
    if (!message) return;
    setMessages(prevMessage => [...prevMessage, { text: message, sender: "me" }]);
    if (socket) {
      socket.send(JSON.stringify({
        type: 'chat',
        payload: {
          message,
          roomId: roomId
        }
      }));
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }
  return (
    <div className='flex flex-col gap-y-3 sm:gap-y-4 border border-neutral-800 p-3 sm:p-4 rounded-lg w-full sm:w-auto'>
      <Header />
      <div className='bg-neutral-800 p-2 sm:p-3 rounded-lg flex flex-col sm:flex-row justify-between gap-1 sm:gap-0'>
        <div className='text-sm sm:text-base break-all'>{`Room Code: ${roomId}`}</div>
        <div className='text-sm sm:text-base'>{`Users ${userCount}/2`}</div>
      </div>
      <div className='border border-neutral-800 rounded-lg w-full p-3 sm:p-4 h-64 sm:h-80 lg:h-96 flex flex-col overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-500/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-500'>
        {messages.map((message, index: number) => (
          <div 
            className={`p-3 sm:p-4 mb-2 rounded-lg w-fit max-w-[70%] sm:max-w-80 break-words text-sm sm:text-base shadow-sm ${message.sender === 'me' ? 'bg-white text-black self-end ml-auto' : 'bg-neutral-800 text-white self-start mr-auto'}`} 
            key={index}
          >
            {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleClick} className='flex flex-col sm:flex-row gap-2'>
        <input ref={inputRef} id='message' type="text" placeholder='Type a message' className='bg-neutral-900 text-white placeholder-neutral-400 border-neutral-800 p-2 sm:p-3 rounded-lg focus:border-white border-2 focus:border-2 w-full sm:w-[80%] text-sm sm:text-base focus:outline-none' />
        <button type='submit' className='bg-white text-black font-semibold p-2 sm:p-3 rounded-lg px-4 sm:px-6 tracking-wider text-sm sm:text-base w-full sm:w-auto'>Send</button>
      </form>
    </div>
  )
}

export default Chat