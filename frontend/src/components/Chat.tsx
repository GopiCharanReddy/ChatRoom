import Header from './Header'

const Chat = () => {
  return (
    <div className='flex flex-col gap-y-4 border border-neutral-800 p-4 rounded-lg'>
      <Header /> 
      <div className='bg-neutral-800 p-2 rounded-lg flex justify-between'>
        <div>Room Code: 808080</div>
        <div>Users 2/2</div>
      </div>
      <div className='border border-neutral-800 rounded-lg w-full p-4 h-80'></div>
      <div className='flex gap-x-2'>
      <input type="text" placeholder='Type a message' className=' border-neutral-800 p-3 rounded-lg focus:border-white border-2 focus:border-2 w-[80%]' />
      <button className='bg-white text-black font-semibold p-3 rounded-lg px-6 tracking-wider'>Send</button>
      </div>
    </div>
  )
}

export default Chat