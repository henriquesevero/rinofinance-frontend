import { RouterProvider } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { router } from "./app/router"

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  )
}

export default App
