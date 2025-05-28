// toast 组件
import { useEffect, useState } from "react"

export default function Toast({ setMessage, message }: { setMessage: (message: string) => void, message: string }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (message) {
            setIsVisible(true)
            const timer = setTimeout(() => {
                setIsVisible(false)
                setTimeout(() => {
                    setMessage('')
                }, 300) // 等待渐隐动画完成后再清空消息
            }, 2700) // 总时间3秒，提前300ms开始渐隐

            return () => clearTimeout(timer)
        }
    }, [message, setMessage])

    if (!message) return null

    return (
        <div
            role="alert"
            className={`alert alert-success fixed bottom-[100px] left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform
                ${isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
        </div>
    )
}