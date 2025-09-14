import React, { createContext, useContext, useEffect, useState } from 'react'

type WebSocketContextType = {
  socket: WebSocket | null,
  isConnected: boolean,
  clientId: string | null,
  lastMessage: any | null
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  clientId: null,
  lastMessage: null
})

export const useWebSocket = () => {
  return useContext(WebSocketContext)
}

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<any | null>(null)
  
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_BASE_URL);
    ws.onopen = () => {
      console.log("Websocket connected.")
      setIsConnected(true)
    }
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLastMessage(data)
      if (data.type === "welcome" && data.id){
        console.log("Client Id is: ", data.id)
        setClientId(data.id)
      }
    }
    ws.onclose = () => {
      console.log("Websocket disconnected.")
      setIsConnected(false)
    }
    setSocket(ws);
    return () => {
      ws.close()
    }
  }, [])

  const value = { socket, isConnected, clientId, lastMessage }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export default WebSocketContext