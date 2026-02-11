import './index.css'
import CubeScene from './components/CubeScene'

function App() {
  return (
    <div className="w-screen h-screen bg-gray-900 flex flex-col">
      <header className="p-4 bg-gray-800">
        <h1 className="text-white text-2xl">魔術方塊盲解訓練</h1>
      </header>
      <main className="flex-1">
        <CubeScene />
      </main>
    </div>
  )
}

export default App
