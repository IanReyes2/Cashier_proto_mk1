"use client"

import {useEffect} from "react"
import { useRouter } from "next/navigation"
import {getCurrentUser} from "@/lib/auth"


export default function HomePage() {
  const router = useRouter()

  useEffect(()=> {
    const user = getCurrentUser() 
    router.push(user ? "/dashboard" : "/login")
  }, [router])
  return null
}
