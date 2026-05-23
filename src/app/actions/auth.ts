"use server"

import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginWithPhone(formData: FormData) {
  const phone = formData.get("phone")?.toString().trim()
  
  if (!phone || phone.length < 8) {
    return { error: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง" }
  }

  // Find or Create user
  let user = await prisma.user.findUnique({
    where: { phoneNumber: phone }
  })

  if (!user) {
    user = await prisma.user.create({
      data: { phoneNumber: phone }
    })
  }

  // Create session
  const sessionData = { userId: user.id, phone: user.phoneNumber }
  const encryptedSession = await encrypt(sessionData)
  
  const cookieStore = await cookies()
  cookieStore.set("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  redirect("/")
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  redirect("/login")
}
