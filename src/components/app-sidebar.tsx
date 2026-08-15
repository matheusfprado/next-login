"use client"

import {
  IconDashboard,
  IconSettings,
  IconUserCircle,
  IconWallet,
  IconPlugConnected,
} from "@tabler/icons-react"
import { useAuth } from "@/src/contexts/AuthContext";
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavMain } from "@/src/components/nav-main"
import { NavUser } from "@/src/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/src/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useAuth()

  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Carteira",
      url: "/dashboard/carteira",
      icon: IconWallet,
      isActive: pathname.startsWith("/dashboard/carteira"),
    },
    {
      title: "Integrações",
      url: "/dashboard/integracoes",
      icon: IconPlugConnected,
      isActive: pathname.startsWith("/dashboard/integracoes"),
    },
    {
      title: "Perfil",
      url: "/dashboard/perfil",
      icon: IconUserCircle,
      isActive: pathname.startsWith("/dashboard/perfil"),
    },
    {
      title: "Configurações",
      url: "/dashboard/configuracoes",
      icon: IconSettings,
      isActive: pathname.startsWith("/dashboard/configuracoes"),
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="InvestHub">
              <Link href="/dashboard">
                <Image
                  src="/icon.png"
                  alt="InvestHub"
                  width={32}
                  height={32}
                  priority
                  className="size-8 rounded-lg"
                />
                <span className="bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                  InvestHub
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: session?.user?.name ?? "Usuário",
            email: session?.user?.email ?? "Conta InvestHub",
            avatar: session?.user?.image ?? undefined,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

