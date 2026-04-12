import { BarChart2, AlertTriangle, Layers, LayersPlus, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Collection', icon: Layers, route: '/collection' },
  { label: 'Add Cards', icon: LayersPlus, route: '/add-card' },
  { label: 'Statistics', icon: BarChart2, route: '/statistics' },
  { label: 'Duplicates', icon: AlertTriangle, route: '/duplicates' },
] as const

const bottomNavItems = [
  { label: 'Settings', icon: Settings, route: '/settings' },
] as const

function NavItem({ label, icon: Icon, route }: { label: string; icon: React.ElementType; route: string }) {
  const { pathname } = useLocation()
  const isActive = pathname === route || pathname.startsWith(route + '/')
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <NavLink to={route} aria-label={label} aria-current={isActive ? 'page' : undefined}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarCollapseButton() {
  const { open, toggleSidebar } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={toggleSidebar}
        tooltip={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {open ? <PanelLeftClose /> : <PanelLeftOpen />}
        <span>Collapse</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItem key={item.route} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <NavItem key={item.route} {...item} />
          ))}
          <SidebarCollapseButton />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
