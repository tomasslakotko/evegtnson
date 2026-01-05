"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Calendar, CreditCard, Settings } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminUsers } from "@/components/admin/admin-users"
import { AdminOrganizations } from "@/components/admin/admin-organizations"
import { AdminSubscriptions } from "@/components/admin/admin-subscriptions"

interface AdminDashboardProps {
  stats: {
    users: number
    organizations: number
    bookings: number
    eventTypes: number
  }
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, organizations, subscriptions, and platform settings.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations}</div>
            <p className="text-xs text-muted-foreground">Corporate accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookings}</div>
            <p className="text-xs text-muted-foreground">All-time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventTypes}</div>
            <p className="text-xs text-muted-foreground">Created event types</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <AdminOrganizations />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <AdminSubscriptions />
        </TabsContent>
      </Tabs>
    </div>
  )
}

