import { useEffect, useRef} from "react"
import Header from "./Header"
import { useWebSocket } from "./WebSocketContext";

type CreateRoomProps = {
  onRoomCreated: (roomId: string, count?: number) => void;
};

const CreateRoom = ({ onRoomCreated }: CreateRoomProps) => {
  const nameRef = useRef<HTMLInputElement>(null);
  const roomIDRef = useRef<HTMLInputElement>(null)
  const { socket, isConnected, lastMessage } = useWebSocket();

  useEffect(() => {
    if(!lastMessage) return;
    if (lastMessage && lastMessage.type === 'roomCreated') {
      const newRoomId = lastMessage.payload.roomId
      const initialCount = lastMessage.payload.userCount;
      onRoomCreated(newRoomId, initialCount);
    }
    if(lastMessage.type === 'joined'){
      const {roomId, userCount} = lastMessage.payload;
      onRoomCreated(roomId, userCount);
    }
  }, [onRoomCreated, lastMessage])

  const handleClick = () => {
    if (isConnected && socket && nameRef.current?.value) {
      socket.send(JSON.stringify({
        type: "create",
        payload: {
          name: nameRef.current.value
        }
      }))
    } else {
      console.log("Socket not connected or name is empty.")
    }
  }
  const handleJoin = () => {
    if (socket && nameRef.current?.value && roomIDRef.current?.value) {
      socket.send(JSON.stringify({
        type: "join",
        payload: {
          name: nameRef.current.value,
          roomId: roomIDRef.current.value
        }
      }))
    } else {
      console.log("Error while joining room.")
    }
  }
  return (
    <div className='w-full'>
      <div className='border-neutral-400 p-4 sm:p-6 outline-neutral-800 outline rounded-lg text-white gap-y-3 sm:gap-y-4 flex flex-col w-full'>
        <div>
          <Header />
        </div>
        <button onClick={handleClick} className='cursor-pointer font-semibold hover:bg-neutral-200 bg-white text-lg sm:text-xl flex justify-center text-black rounded-md p-2 sm:p-3 w-full'>Create New Room</button>
        {!isConnected && <p className='text-sm sm:text-base text-neutral-300'>Connecting to server...</p>}
        <input ref={nameRef} type="text" placeholder='Enter your name' className='text-neutral-100 p-2 sm:p-3 w-full border focus:border-neutral-100 outline-none border-neutral-800 rounded-md text-sm sm:text-base' />
        <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
          <input ref={roomIDRef} type="text" placeholder='Enter Room Code' className='text-neutral-100 p-2 sm:p-3 w-full border focus:border-neutral-100 outline-none border-neutral-800 rounded-md text-sm sm:text-base' />
          <button onClick={handleJoin} className='cursor-pointer bg-white hover:bg-neutral-200 w-full sm:w-auto sm:min-w-[120px] text-black rounded-lg font-semibold p-2 sm:p-3 text-sm sm:text-base'>Join Room</button>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom