'use client'

import React from 'react'
import { Layout, Menu, theme } from 'antd'
import { DashboardOutlined, AppstoreOutlined, DollarOutlined, UserOutlined, ApiOutlined, PictureOutlined, BgColorsOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const { Header, Content, Sider } = Layout

export default function AdminLayout({ children }) {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()
    const pathname = usePathname()

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider breakpoint="lg" collapsedWidth="0">
                <div style={{ padding: '16px', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                    Admin Portal
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={[
                        {
                            key: '/',
                            icon: <DashboardOutlined />,
                            label: <Link href="/">Dashboard</Link>,
                        },
                        {
                            key: '/apps',
                            icon: <AppstoreOutlined />,
                            label: <Link href="/apps">Apps Management</Link>,
                        },
                        {
                            key: '/pricing',
                            icon: <DollarOutlined />,
                            label: <Link href="/pricing">Pricing Plans</Link>,
                        },
                        {
                            key: '/features',
                            icon: <DollarOutlined />,
                            label: <Link href="/features">Features</Link>,
                        },
                        {
                            key: '/users',
                            icon: <UserOutlined />,
                            label: <Link href="/users">User Management</Link>,
                        },
                        {
                            key: '/stripe',
                            icon: <ApiOutlined />,
                            label: <Link href="/stripe">Stripe Management</Link>,
                        },
                        {
                            key: '/templates',
                            icon: <PictureOutlined />,
                            label: <Link href="/templates">Templates</Link>,
                        },
                        {
                            key: '/site-theme',
                            icon: <BgColorsOutlined />,
                            label: <Link href="/site-theme">Site Theme</Link>,
                        },
                    ]}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>Overview</span>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}
