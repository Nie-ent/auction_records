"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function getAuctionRecords() {
  try {
    const session = await getSession()
    if (!session) return []

    const records = await prisma.auctionRecord.findMany({
      where: { userId: session.userId },
      orderBy: { date: 'desc' },
    })

    return records.map(record => ({
      ...record,
      services: record.services as { name: string; price: number }[] | null
    }))
  } catch (error) {
    console.error("Failed to fetch auction records:", error)
    return []
  }
}

export async function createAuctionRecord(data: {
  price: number;
  itemName?: string | null;
  exchangeRate: number;
  depositThb: number | null;
  feeThb: number | null;
  imageUrl?: string | null;
  purchasedAt?: Date;
  receivedAt?: Date | null;
  amount?: number;
  services?: { name: string; price: number }[]; // JSON representation of {name: string, price: number}[]
}) {
  try {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    await prisma.auctionRecord.create({
      data: {
        date: new Date(),
        itemName: data.itemName || null,
        price: data.price,
        exchangeRate: data.exchangeRate,
        depositThb: data.depositThb,
        feeThb: data.feeThb,
        imageUrl: data.imageUrl || "",
        purchasedAt: data.purchasedAt || new Date(),
        receivedAt: data.receivedAt || null,
        userId: session.userId,
        amount: data.amount || 1,
        services: data.services || [],
      },
    })
    revalidatePath('/')
  } catch (error) {
    console.error("Failed to create auction record:", error)
    throw new Error('Failed to create auction record')
  }
}

export async function updateAuctionRecordSoldPrice(id: string, soldPrice: number) {
  try {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    await prisma.auctionRecord.update({
      where: { id },
      data: { 
        soldPrice,
        soldAt: soldPrice > 0 ? new Date() : null,
      },
    })
    revalidatePath('/')
  } catch (error) {
    console.error("Failed to update sold price:", error)
    throw new Error('Failed to update sold price')
  }
}

export async function updateAuctionRecord(
  id: string,
  data: {
    price: number;
    itemName?: string | null;
    exchangeRate: number;
    depositThb: number | null;
    feeThb: number | null;
    purchasedAt?: Date;
    receivedAt?: Date | null;
    soldAt?: Date | null;
    services?: { name: string; price: number }[];
  }
) {
  try {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    await prisma.auctionRecord.update({
      where: { id },
      data,
    })
    revalidatePath('/')
  } catch (error) {
    console.error("Failed to update auction record:", error)
    throw new Error('Failed to update auction record')
  }
}

export async function deleteAuctionRecord(id: string) {
  try {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    await prisma.auctionRecord.delete({
      where: { id }
    })
    revalidatePath('/')
  } catch (error) {
    console.error("Failed to delete auction record:", error)
    throw new Error('Failed to delete auction record')
  }
}
