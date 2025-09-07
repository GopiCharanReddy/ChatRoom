import Header from "./Header"

const CreateRoom = () => {
  return (
    <div className='bg-neutral-950 min-h-screen flex justify-center items-center'>
      <div className='border-neutral-400 p-6 outline-neutral-800  outline rounded-lg text-white gap-y-4 flex flex-col'>
        <div>
          <Header />
          
        </div>
        <button className='cursor-pointer font-semibold hover:bg-neutral-200 bg-white text-xl flex justify-center text-black w-xl rounded-md p-2'>Create New Room</button>
        <input type="text" placeholder='Enter you name' className='text-neutral-100 p-2 w-full border focus:border-neutral-100 outline-none border-neutral-800 rounded-md' />
        <div className='flex gap-2'>
          <input type="text" placeholder='Enter Room Code' className='text-neutral-100 p-2 w-full border focus:border-neutral-100 outline-none border-neutral-800 rounded-md' />
          <button className='cursor-pointer bg-white hover:bg-neutral-200 w-[30%] text-black rounded-lg font-semibold'>Join Room</button>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom