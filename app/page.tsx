import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to seats page
  redirect('/seats')
}