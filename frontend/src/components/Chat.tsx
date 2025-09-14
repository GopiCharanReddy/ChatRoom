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
    <div className='flex flex-col gap-y-4 border border-neutral-800 p-4 rounded-lg'>
      <Header />
      <div className='bg-neutral-800 p-2 rounded-lg flex justify-between'>
        <div>{`Room Code: ${roomId}`}</div>
        <div>{`Users ${userCount}/2`}</div>
      </div>
      <div className='border border-neutral-800 rounded-lg w-full p-4 h-80 flex flex-col overflow-auto [&::-webkit-scrollbar]:w-1.5
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:bg-slate-500/40
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb:hover]:bg-slate-500'>{messages.map((message, index: number) => <div className={`p-2 mt-2 rounded-lg inset-0 w-fit max-w-80 break-words ${message.sender === 'me' ? 'bg-white text-black self-end' : 'bg-neutral-800 text-white self-start'}`} key={index}>{message.text}</div>)}</div>
      <form onSubmit={handleClick} className='flex gap-x-2'>
        <input ref={inputRef} id='message' type="text" placeholder='Type a message' className=' border-neutral-800 p-3 rounded-lg focus:border-white border-2 focus:border-2 w-[80%]' />
        <button type='submit' className='bg-white text-black font-semibold p-3 rounded-lg px-6 tracking-wider'>Send</button>
      </form>
    </div>
  )
}

export default Chat