import { useEffect, useRef, useState } from "react"
import Header from "./Header"
import { useWebSocket } from "./WebSocketContext";

type CreateRoomProps = {
  onRoomCreated: (roomId: string, count?: number) => void;
};

const CreateRoom = ({ onRoomCreated }: CreateRoomProps) => {
  const nameRef = useRef<HTMLInputElement>(null);
  const roomIDRef = useRef<HTMLInputElement>(null)
  const [newRoomId, setNewRoomId] = useState<string>('')
  const { socket, isConnected, lastMessage } = useWebSocket();

  useEffect(() => {
    if(!lastMessage) return;
    if (lastMessage && lastMessage.type === 'roomCreated') {
      const newRoomId = lastMessage.payload.roomId
      setNewRoomId(newRoomId)
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
    <div className='bg-neutral-950 min-h-screen flex justify-center items-center'>
      <div className='border-neutral-400 p-6 outline-neutral-800  outline rounded-lg text-white gap-y-4 flex flex-col'>
        <div>
          <Header />
        </div>
        <button onClick={handleClick} className='cursor-pointer font-semibold hover:bg-neutral-200 bg-white text-xl flex justify-center text-black w-xl rounded-md p-2'>Create New Room</button>
        {!isConnected && <p>Connecting to server...</p>}
        <input ref={nameRef} type="text" placeholder='Enter your name' className='text-neutral-100 p-2 w-full border focus:border-neutral-100 outline-none border-neutral-800 rounded-md' />
        <div className='flex gap-2'>
          <input ref={roomIDRef} type="text" placeholder='Enter Room Code' className='text-neutral-100 p-2 w-full border focus:border-neutral-100 outline-none border-neutral-800 rounded-md' />
          <button onClick={handleJoin} className='cursor-pointer bg-white hover:bg-neutral-200 w-[30%] text-black rounded-lg font-semibold'>Join Room</button>
        </div>
        {newRoomId &&
          <div className="bg-neutral-900 h-30 rounded-lg flex flex-col justify-center items-center">
            <div className="text-neutral-500">Share this room id with you friend</div>
            <h1 className="text-2xl mt-2">{`Room ID: ${newRoomId}`} </h1>
          </div>}
      </div>
      <div>
      </div>
    </div>
  )
}

export default CreateRoom