/**
 * 로딩 스피너 컴포넌트
 */
export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label="로딩 중">
      <div
        className={`${sizes[size]} border-amber-200 border-t-amber-700 rounded-full animate-spin`}
      />
      {text && <p className="text-amber-800 text-sm font-medium">{text}</p>}
    </div>
  )
}
