// Admin role helper functions
import { prisma } from "@/lib/prisma"

export const SYSTEM_ADMIN_ROLE = "system_admin"

export async function isSystemAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  
  return user?.role === SYSTEM_ADMIN_ROLE
}

export async function requireSystemAdmin(userId: string): Promise<void> {
  const isAdmin = await isSystemAdmin(userId)
  if (!isAdmin) {
    throw new Error("System admin access required")
  }
}

// Check if user has admin access (system admin or org owner/admin)
export async function hasAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      role: true,
      organizationId: true
    }
  })
  
  if (!user) return false
  
  // System admin has full access
  if (user.role === SYSTEM_ADMIN_ROLE) return true
  
  // Org owner/admin has org-level access
  if (user.organizationId && (user.role === "owner" || user.role === "admin")) {
    return true
  }
  
  return false
}

