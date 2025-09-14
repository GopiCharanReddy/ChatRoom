
const Header = () => {
  return (
    <div>
      <div className='text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 sm:gap-3 lg:gap-4'>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide w-6 h-6 sm:w-7 sm:h-7 lg:w-[30px] lg:h-[30px] lucide-message-circle-more-icon lucide-message-circle-more"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg>
        <span className='break-words'>Real Time Chat</span>
      </div>
      <div className='text-sm sm:text-base text-neutral-400 mt-1 sm:mt-2'>temporary room Chat that expires after all users exit.</div>
    </div>
  )
}

export default Header